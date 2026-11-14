import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { EditorError } from "./editor-validation.mjs";

export const adminCookieName = "wedding_admin_online";
const lifetime = 8 * 60 * 60;
const digest = value => createHash("sha256").update(value).digest();
const equal = (first, second) => timingSafeEqual(digest(first), digest(second));

export function createOnlineAdminAuth(env = process.env) {
  const configured = Boolean(env.ADMIN_USERNAME?.trim() && env.ADMIN_PASSWORD?.length >= 12);
  const secret = `${env.ADMIN_USERNAME ?? ""}\0${env.ADMIN_PASSWORD ?? ""}`;
  const sign = value => createHmac("sha256", secret).update(value).digest("base64url");

  function session(value) {
    if (!configured || typeof value !== "string" || value.length > 512) return null;
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra || !equal(signature, sign(payload))) return null;
    try {
      const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (!Number.isSafeInteger(data.expires) || data.expires <= Date.now() || data.expires > Date.now() + lifetime * 1000 || typeof data.nonce !== "string") return null;
      return { token: sign(`csrf:${payload}`) };
    } catch { return null; }
  }

  function requestSession(request) {
    const value = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${adminCookieName}=`))?.slice(adminCookieName.length + 1);
    return session(value);
  }

  function sameOrigin(request) {
    const expected = new URL(request.url);
    expected.host = request.headers.get("host") || expected.host;
    if (request.headers.get("x-forwarded-proto") === "https") expected.protocol = "https:";
    if (request.headers.get("origin") !== expected.origin) throw new EditorError(403, "Origin không hợp lệ.");
  }

  function authorize(request, write = false) {
    const active = requestSession(request);
    if (!active) throw new EditorError(401, "Cần đăng nhập để chỉnh sửa nội dung.");
    if (write) {
      sameOrigin(request);
      if (!equal(request.headers.get("x-editor-token") ?? "", active.token)) throw new EditorError(403, "Phiên chỉnh sửa không hợp lệ. Tải lại admin rồi thử lại.");
    }
    return active;
  }

  function cookie(value, request) {
    const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    return `${adminCookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${value ? lifetime : 0}${secure ? "; Secure" : ""}`;
  }

  function login(credentials, request) {
    sameOrigin(request);
    if (!configured) throw new EditorError(503, "Cần cấu hình ADMIN_USERNAME và ADMIN_PASSWORD (ít nhất 12 ký tự) trên server.");
    const validUser = equal(typeof credentials?.username === "string" ? credentials.username : "", env.ADMIN_USERNAME);
    const validPassword = equal(typeof credentials?.password === "string" ? credentials.password : "", env.ADMIN_PASSWORD);
    if (!validUser || !validPassword) throw new EditorError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");
    const payload = Buffer.from(JSON.stringify({ expires: Date.now() + lifetime * 1000, nonce: randomBytes(32).toString("hex") })).toString("base64url");
    return cookie(`${payload}.${sign(payload)}`, request);
  }

  return { configured, session, requestSession, sameOrigin, authorize, cookie, login };
}

export async function readEditorJson(request, limit = 1024 * 1024) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw new EditorError(415, "Yêu cầu dữ liệu JSON.");
  if (Number(request.headers.get("content-length")) > limit) throw new EditorError(413, "Nội dung vượt giới hạn cho phép.");
  const reader = request.body?.getReader();
  if (!reader) throw new EditorError(400, "Thiếu nội dung yêu cầu.");
  let length = 0;
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new EditorError(413, "Nội dung vượt giới hạn cho phép."); }
      chunks.push(Buffer.from(value));
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new EditorError(400, "JSON không hợp lệ."); }
  } finally { reader.releaseLock(); }
}
