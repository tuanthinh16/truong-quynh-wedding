import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const cookieName = "wedding_admin_session";
const sessionLifetime = 8 * 60 * 60 * 1000;
const loginWindow = 15 * 60 * 1000;
const digest = value => createHash("sha256").update(value).digest();

export function createAdminAuth({ origin, aliases = [], username, password }) {
  const origins = new Map([origin, ...aliases].map(value => [new URL(value).host, value]));
  const configured = typeof username === "string" && Boolean(username.trim()) && typeof password === "string" && password.length >= 12;
  const expectedUser = digest(username || "");
  const expectedPassword = digest(password || "");
  const sessions = new Map();
  let attempts = [];

  function cookieToken(request) {
    const value = String(request.headers.cookie || "").split(";").map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
  }
  function sessionKey(request) {
    const value = cookieToken(request);
    return value ? digest(value).toString("hex") : null;
  }
  function authenticated(request) {
    const now = Date.now();
    for (const [key, expiration] of sessions) if (expiration <= now) sessions.delete(key);
    return configured && sessions.has(sessionKey(request));
  }
  function cookie(value, maxAge, requestOrigin) {
    return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${requestOrigin.startsWith("https:") ? "; Secure" : ""}`;
  }
  async function credentials(request) {
    if (String(request.headers["content-type"]).split(";")[0] !== "application/json") throw new Error("invalid");
    const chunks = [];
    let length = 0;
    for await (const chunk of request) {
      length += chunk.length;
      if (length > 4096) throw new Error("invalid");
      chunks.push(chunk);
    }
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value.username !== "string" || typeof value.password !== "string") throw new Error("invalid");
    return value;
  }
  return async function handle(request, response) {
    const url = new URL(request.url, origin);
    let pathname;
    try { pathname = decodeURIComponent(url.pathname).replace(/\\/g, "/").replace(/\/{2,}/g, "/"); }
    catch { pathname = url.pathname; }
    const adminPage = pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/admin.html";
    const authEndpoint = pathname.startsWith("/__editor/auth/");
    const editorApi = pathname.startsWith("/__editor/api/");
    if (!adminPage && !authEndpoint && !editorApi) return false;
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "SAMEORIGIN");
    function json(status, payload) { response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" }); response.end(JSON.stringify(payload)); return true; }
    function redirect(location) { response.writeHead(303, { Location: location }); response.end(); return true; }
    const requestOrigin = origins.get(request.headers.host);
    if (!requestOrigin || (request.headers.origin && request.headers.origin !== requestOrigin)) return json(403, { error: "Origin không hợp lệ." });
    if ((authEndpoint || editorApi) && request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin") return json(403, { error: "Chỉ cho phép yêu cầu cùng origin." });
    if (request.method !== "GET" && request.headers.origin !== requestOrigin) return json(403, { error: "Origin không hợp lệ." });

    if (pathname === "/__editor/auth/session" && request.method === "GET") return json(200, { configured, authenticated: authenticated(request) });
    if (pathname === "/__editor/auth/login" && request.method === "POST") {
      if (!configured) return json(503, { error: "Cấu hình ADMIN_USERNAME và ADMIN_PASSWORD (ít nhất 12 ký tự) trong .env.local rồi khởi động lại npm run dev." });
      const now = Date.now();
      attempts = attempts.filter(time => time > now - loginWindow);
      if (attempts.length >= 10) {
        response.setHeader("Retry-After", String(Math.ceil((attempts[0] + loginWindow - now) / 1000)));
        return json(429, { error: "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút." });
      }
      attempts.push(now);
      let input;
      try { input = await credentials(request); } catch { return json(400, { error: "Dữ liệu đăng nhập không hợp lệ." }); }
      const validUser = timingSafeEqual(digest(input.username), expectedUser);
      const validPassword = timingSafeEqual(digest(input.password), expectedPassword);
      if (!validUser || !validPassword) return json(401, { error: "Tên đăng nhập hoặc mật khẩu không đúng." });
      attempts = [];
      sessions.delete(sessionKey(request));
      for (const [key, expiration] of sessions) if (expiration <= now) sessions.delete(key);
      while (sessions.size >= 32) sessions.delete(sessions.keys().next().value);
      const token = randomBytes(32).toString("hex");
      sessions.set(digest(token).toString("hex"), now + sessionLifetime);
      response.setHeader("Set-Cookie", cookie(token, sessionLifetime / 1000, requestOrigin));
      return json(200, { authenticated: true });
    }
    if (pathname === "/__editor/auth/logout" && request.method === "POST") {
      sessions.delete(sessionKey(request));
      response.setHeader("Set-Cookie", cookie("", 0, requestOrigin));
      return json(200, { authenticated: false });
    }
    if (authEndpoint) return json(405, { error: "Endpoint hoặc phương thức không hỗ trợ." });
    if (pathname === "/admin/login" || pathname === "/admin/login/") return authenticated(request) ? redirect("/admin") : false;
    if (!authenticated(request)) return editorApi ? json(401, { error: "Cần đăng nhập để chỉnh sửa nội dung." }) : redirect("/admin/login");
    return false;
  };
}
