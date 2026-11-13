import { randomBytes, timingSafeEqual } from "node:crypto";
import sharp from "sharp";
import { validateContent } from "../../scripts/editor/service.mjs";
import { fieldKind } from "./editor-schema.mjs";
import { digest } from "./cloud-store.mjs";
import { mailConfigured } from "./rsvp-mail.mjs";

const cookieName = "wedding_admin_session";
const lifetime = 8 * 60 * 60;
export const cloudUploadLimit = 4 * 1024 * 1024;
export class CloudError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const same = (first, second) => timingSafeEqual(Buffer.from(digest(String(first))), Buffer.from(digest(String(second))));
export async function requestBytes(request, limit) {
  if (Number(request.headers.get("content-length")) > limit) throw new CloudError(413, "Dữ liệu vượt giới hạn dung lượng.");
  const reader = request.body?.getReader();
  if (!reader) throw new CloudError(400, "Thiếu dữ liệu.");
  const chunks = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) { await reader.cancel(); throw new CloudError(413, "Dữ liệu vượt giới hạn dung lượng."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
async function requestJson(request, limit) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw new CloudError(415, "Dữ liệu phải là JSON.");
  const bytes = await requestBytes(request, limit);
  try { return JSON.parse(bytes.toString("utf8")); } catch { throw new CloudError(400, "JSON không hợp lệ."); }
}
export function createCloudEditor({ store, baseline, env = process.env, listRsvps }) {
  const baselineRevision = digest(JSON.stringify(baseline));
  const credentialsReady = () => Boolean(env.ADMIN_USERNAME?.trim() && env.ADMIN_PASSWORD?.length >= 12);
  const credentialsHash = () => digest(`${env.ADMIN_USERNAME}\0${env.ADMIN_PASSWORD}`);
  const cookie = (value, age, url) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${url.protocol === "https:" ? "; Secure" : ""}`;
  async function session(request) {
    const token = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!credentialsReady() || !token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const key = `sessions/${digest(token)}.json`;
    const current = await store.read(key);
    return current && current.data.expires > Date.now() && same(current.data.credentials, credentialsHash()) ? { ...current.data, key } : null;
  }
  async function content() {
    const current = await store.read("content.json");
    return { data: current?.data || baseline, revision: current?.etag || baselineRevision };
  }
  async function save(input) {
    if (!input || typeof input.revision !== "string" || !input.data) throw new CloudError(400, "Cần nội dung và revision hợp lệ.");
    const current = await content();
    if (input.revision !== current.revision) throw new CloudError(409, "Nội dung đã thay đổi ở phiên khác. Tải lại dữ liệu trước khi lưu.");
    validateContent(input.data, baseline);
    async function verifyImages(value, previous, trail = []) {
      if (value && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) await verifyImages(child, previous?.[key], [...trail, key]);
      } else if (fieldKind(trail, value) === "image" && value && value !== previous) {
        if (defaultImages.has(value)) return;
        if (/^\/uploads\/editor\/[a-f0-9-]{36}\.webp$/.test(value)) {
          if (!await store.read(`media/${value.split("/").at(-1)}.json`)) throw new CloudError(422, "Ảnh upload không tồn tại.");
        } else throw new CloudError(422, "Chọn ảnh có trong thư viện.");
      }
    }
    await verifyImages(input.data, current.data);
    const data = structuredClone(input.data);
    data._meta = { ...baseline._meta, updatedAt: new Date().toISOString() };
    await store.write(`history/${Date.now()}-${store.randomId()}.json`, current.data, { ttlDays: 30 });
    try {
      const result = await store.write("content.json", data, { etag: current.revision === baselineRevision ? undefined : current.revision });
      return { data, revision: result.etag };
    } catch (error) {
      if ((await content()).revision !== current.revision) throw new CloudError(409, "Nội dung đã thay đổi ở phiên khác. Bản nháp chưa bị ghi đè.");
      throw error;
    }
  }
  const defaultImages = new Set();
  function images(value, trail = []) {
    if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) images(child, [...trail, key]);
    else if (fieldKind(trail, value) === "image" && value) defaultImages.add(value);
  }
  images(baseline);
  async function upload(request) {
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(request.headers.get("content-type")?.split(";")[0])) throw new CloudError(415, "Chỉ nhận JPG, PNG, WebP hoặc AVIF.");
    const bytes = await requestBytes(request, cloudUploadLimit);
    let converted;
    try {
      const image = sharp(bytes, { limitInputPixels: 30000000, animated: false });
      const metadata = await image.metadata();
      if (!["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format) || (metadata.pages || 1) > 1) throw new Error("format");
      converted = await image.rotate().resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true }).webp(request.headers.get("x-editor-image-purpose") === "qr" ? { lossless: true } : { quality: 88 }).toBuffer({ resolveWithObject: true });
    } catch { throw new CloudError(422, "Ảnh không hợp lệ hoặc vượt 30 megapixel."); }
    const name = `${store.randomId()}.webp`;
    await store.image(`images/${name}`, converted.data);
    const asset = { src: `/uploads/editor/${name}`, name, size: converted.data.length, width: converted.info.width, height: converted.info.height };
    await store.write(`media/${name}.json`, asset);
    return asset;
  }
  async function handle(request, path) {
    const url = new URL(request.url);
    const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "SAMEORIGIN" };
    const json = (data, status = 200, extra = {}) => Response.json(data, { status, headers: { ...headers, ...extra } });
    try {
      if (request.headers.get("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin" || request.method !== "GET" && request.headers.get("origin") !== url.origin) throw new CloudError(403, "Chỉ cho phép yêu cầu cùng origin.");
      if (!env.BLOB_READ_WRITE_TOKEN) throw new CloudError(503, "Chưa cấu hình Vercel Blob private. Thêm BLOB_READ_WRITE_TOKEN trong Environment Variables rồi redeploy.");
      if (path === "auth/session" && request.method === "GET") return json({ configured: credentialsReady(), authenticated: Boolean(await session(request)) });
      if (path === "auth/login" && request.method === "POST") {
        if (!credentialsReady()) throw new CloudError(503, "Cấu hình ADMIN_USERNAME và ADMIN_PASSWORD (ít nhất 12 ký tự) trong Vercel Environment Variables rồi redeploy.");
        if (!await store.consume(`limits/login-${Math.floor(Date.now() / 900000)}.json`, 10)) throw new CloudError(429, "Đăng nhập quá nhiều lần. Thử lại sau 15 phút.");
        const input = await requestJson(request, 4096);
        if (typeof input?.username !== "string" || typeof input?.password !== "string" || !same(input.username, env.ADMIN_USERNAME) || !same(input.password, env.ADMIN_PASSWORD)) throw new CloudError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");
        const token = randomBytes(32).toString("hex");
        await store.write(`sessions/${digest(token)}.json`, { credentials: credentialsHash(), csrf: randomBytes(32).toString("hex"), expires: Date.now() + lifetime * 1000 }, { ttlDays: 1 });
        return json({ authenticated: true }, 200, { "Set-Cookie": cookie(token, lifetime, url) });
      }
      const current = await session(request);
      if (!current) throw new CloudError(401, "Cần đăng nhập để chỉnh sửa nội dung.");
      if (path === "auth/logout" && request.method === "POST") { await store.remove(current.key); return json({ authenticated: false }, 200, { "Set-Cookie": cookie("", 0, url) }); }
      if (path === "api/status" && request.method === "GET") return json({ enabled: true, token: current.csrf, maxUploadBytes: cloudUploadLimit, storage: "blob" });
      if (!same(request.headers.get("x-editor-token") || "", current.csrf)) throw new CloudError(403, "Token editor không hợp lệ.");
      if (path === "api/content" && request.method === "GET") return json(await content());
      if (path === "api/content" && request.method === "PUT") return json(await save(await requestJson(request, 1024 * 1024)));
      if (path === "api/upload" && request.method === "POST") return json(await upload(request), 201);
      if (path === "api/media" && request.method === "GET") {
        const uploaded = await store.files("media/");
        const assets = await Promise.all(uploaded.map(file => store.read(file.pathname.slice(store.pathname("").length)).then(item => item.data)));
        return json({ assets: [...assets, ...[...defaultImages].map(src => ({ src, name: src.split("/").at(-1), size: 0 }))] });
      }
      if (path === "api/rsvps" && request.method === "GET") return json({ ...await listRsvps(), mail: { configured: mailConfigured(env), enabled: (await content()).data.mail.enabled } });
      return json({ error: "Endpoint hoặc phương thức không hỗ trợ." }, 405);
    } catch (error) {
      const status = error instanceof CloudError || Number.isInteger(error.status) && error.status >= 400 && error.status < 500 ? error.status : 503;
      return json({ error: status < 500 || error instanceof CloudError ? error.message : "Không kết nối được kho Vercel Blob private. Kiểm tra token và loại store." }, status);
    }
  }
  return { handle, content };
}
