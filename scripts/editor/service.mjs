import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fieldKind, listConfig } from "../../src/lib/editor-schema.mjs";
import { listRsvps } from "../../src/lib/rsvp-service.mjs";
import { mailConfigured } from "../../src/lib/rsvp-mail.mjs";

// Added 2026-11-13: bounded, same-origin uploads and atomic JSON writes with revision checks and private backups.
const maxUpload = 10 * 1024 * 1024;
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const icons = new Set(["heart", "arrow", "pin", "calendar", "check", "close", "chevron", "copy", "car", "flower", "rings", "image", "music", "play", "pause", "scroll"]);
const unsafeKeys = new Set(["__proto__", "constructor", "prototype"]);
class EditorError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const revisionOf = bytes => createHash("sha256").update(bytes).digest("hex");

async function body(request, limit) {
  if (Number(request.headers["content-length"]) > limit) throw new EditorError(413, "Dữ liệu vượt giới hạn dung lượng.");
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > limit) throw new EditorError(413, "Dữ liệu vượt giới hạn dung lượng.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function validateContent(input, baseline) {
  function visit(value, previous, trail) {
    const label = trail.join(".");
    function invalid(message) { throw new EditorError(422, `${label}: ${message}`); }
    if (Array.isArray(previous)) {
      if (!Array.isArray(value)) invalid("cần một danh sách.");
      const config = listConfig(trail);
      if (value.length < (config?.min ?? previous.length) || value.length > (config?.max ?? previous.length)) invalid("số mục không phù hợp với bố cục.");
      value.forEach((entry, index) => visit(entry, previous[index] ?? config?.template ?? previous[0], [...trail, index]));
    } else if (previous && typeof previous === "object") {
      if (!value || typeof value !== "object" || Array.isArray(value)) invalid("cần dữ liệu dạng object.");
      const expected = Object.keys(previous).filter(key => !key.startsWith("_"));
      const supplied = Object.keys(value).filter(key => !key.startsWith("_"));
      if (supplied.length !== expected.length || supplied.some(key => unsafeKeys.has(key) || !expected.includes(key))) invalid("cấu trúc nội dung không hợp lệ.");
      if (Object.keys(value).some(key => unsafeKeys.has(key) || key.startsWith("_") && (key !== "_meta" || trail.length !== 0))) invalid("không được thêm trường hệ thống.");
      for (const key of expected) visit(value[key], previous[key], [...trail, key]);
    } else {
      const key = trail.at(-1);
      if (value === null && ["dateTime", "mapUrl"].includes(key)) return;
      const kind = fieldKind(trail, previous);
      if (kind === "number") {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1e9) invalid("cần số không âm hợp lệ.");
        if (key === "volume" && value > 1) invalid("âm lượng từ 0 đến 1.");
        if (key === "pixelsPerSecond" && value > 200) invalid("tốc độ tối đa 200 px/s.");
        if (key === "rampMilliseconds" && value > 60000) invalid("thời gian tối đa 60000 ms.");
        return;
      }
      if (kind === "toggle") { if (typeof value !== "boolean") invalid("cần true hoặc false."); return; }
      if (typeof value !== "string" || value.length > 10000) invalid("cần văn bản không quá 10000 ký tự.");
      if (kind === "image" && !(key === "qrImage" && value === "") && !/^\/(?!\/)(?!.*(?:\.\.|[\\?#\u0000-\u001f])).+\.(?:jpe?g|png|webp|avif)$/i.test(value)) invalid("chọn ảnh JPG, PNG, WebP hoặc AVIF trong public.");
      if (kind === "url" && value) { try { if (!["http:", "https:"].includes(new URL(value).protocol)) invalid("link chỉ hỗ trợ http/https."); } catch { invalid("link không hợp lệ."); } }
      if (kind === "date") {
        const match = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.exec(value);
        if (!match || Number.isNaN(Date.parse(value))) invalid("ngày giờ ISO 8601 không hợp lệ.");
        const calendar = new Date(`${value.slice(0, 10)}T00:00:00Z`);
        if (calendar.toISOString().slice(0, 10) !== value.slice(0, 10)) invalid("ngày không tồn tại trong lịch.");
      }
      if (kind === "icon" && !icons.has(value)) invalid("biểu tượng không được hỗ trợ.");
      if (kind === "day" && value) {
        const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
        if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) invalid("ngày cần đúng định dạng YYYY-MM-DD và tồn tại trong lịch.");
      }
      if (key === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) invalid("giờ cần định dạng HH:mm.");
      if (["name", "src", "storageKey"].includes(key) && !value.trim()) invalid("không được bỏ trống.");
      if (trail.join(".") === "experience.audio.src" && !/^\/(?!\/)(?!.*(?:\.\.|[\\?#])).+\.(?:mp3|m4a|ogg|wav)$/i.test(value)) invalid("nhạc cần đường dẫn file âm thanh trong public.");
    }
  }
  visit(input, baseline, []);
}

export function createEditorService({ root, origin, aliases = [], token }) {
  const origins = new Map([origin, ...aliases].map(value => [new URL(value).host, value]));
  const contentFile = path.join(root, "src/data/wedding.json");
  let queue = Promise.resolve();
  async function directory(relative) {
    let current = root;
    for (const segment of relative.split("/")) {
      current = path.join(current, segment);
      try { if ((await fs.lstat(current)).isSymbolicLink()) throw new EditorError(403, "Không ghi vào thư mục symlink."); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    await fs.mkdir(current, { recursive: true });
    if (!(await fs.realpath(current)).startsWith(await fs.realpath(root) + path.sep)) throw new EditorError(403, "Thư mục nằm ngoài dự án.");
    return current;
  }
  async function read() {
    if ((await fs.lstat(contentFile)).isSymbolicLink() || !(await fs.realpath(contentFile)).startsWith(await fs.realpath(root) + path.sep)) throw new EditorError(403, "File dữ liệu không hợp lệ.");
    const bytes = await fs.readFile(contentFile);
    return { data: JSON.parse(bytes.toString("utf8")), revision: revisionOf(bytes), bytes };
  }
  async function save(input) {
    if (!input || typeof input !== "object" || Array.isArray(input) || typeof input.revision !== "string" || !input.data) throw new EditorError(400, "Cần nội dung và revision hợp lệ.");
    const current = await read();
    if (input.revision !== current.revision) throw new EditorError(409, "Nội dung đã thay đổi ở phiên khác. Tải lại dữ liệu trước khi lưu; bản nháp chưa bị ghi đè.");
    validateContent(input.data, current.data);
    const next = structuredClone(input.data);
    const publicRoot = await fs.realpath(path.join(root, "public"));
    async function verifyImages(value, previous, trail = []) {
      if (value && typeof value === "object") { for (const [key, entry] of Object.entries(value)) if (!key.startsWith("_")) await verifyImages(entry, previous?.[key], [...trail, Array.isArray(value) ? Number(key) : key]); }
      else if (fieldKind(trail, value) === "image" && value && value !== previous) {
        let actual;
        try { actual = await fs.realpath(path.join(publicRoot, decodeURIComponent(value))); } catch { throw new EditorError(422, "Ảnh chưa có trong public. Hãy upload hoặc chọn từ thư viện."); }
        if (!actual.startsWith(publicRoot + path.sep) || !imageExtensions.has(path.extname(actual).toLowerCase()) || !(await fs.stat(actual)).isFile()) throw new EditorError(422, "Ảnh nằm ngoài public hoặc định dạng không hỗ trợ.");
      }
    }
    await verifyImages(next, current.data);
    next._meta = { ...current.data._meta, updatedAt: new Date().toISOString(), purpose: "2026-11-13: Nội dung được lưu bằng visual editor; ảnh upload trong public/uploads/editor." };
    const history = await directory(".editor/history");
    await fs.writeFile(path.join(history, `${Date.now()}-${randomUUID()}.json`), current.bytes, { flag: "wx", mode: 0o600 });
    const bytes = Buffer.from(JSON.stringify(next, null, 2) + "\n");
    const temporary = `${contentFile}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, bytes, { flag: "wx" });
      if ((await read()).revision !== current.revision) throw new EditorError(409, "File vừa thay đổi trong khi lưu. Vui lòng tải lại.");
      await fs.rename(temporary, contentFile);
    } finally { await fs.unlink(temporary).catch(() => {}); }
    return { data: next, revision: revisionOf(bytes) };
  }
  async function upload(request) {
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(String(request.headers["content-type"]).split(";")[0])) throw new EditorError(415, "Chỉ nhận JPG, PNG, WebP hoặc AVIF.");
    const bytes = await body(request, maxUpload);
    let converted;
    try {
      const image = sharp(bytes, { limitInputPixels: 30000000, animated: false });
      const metadata = await image.metadata();
      if (!["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw new Error("format");
      converted = await image.rotate().resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true }).webp(request.headers["x-editor-image-purpose"] === "qr" ? { lossless: true } : { quality: 88 }).toBuffer({ resolveWithObject: true });
    } catch { throw new EditorError(422, "Ảnh không hợp lệ hoặc vượt quá 30 megapixel."); }
    const folder = await directory("public/uploads/editor");
    const name = `${randomUUID()}.webp`;
    await fs.writeFile(path.join(folder, name), converted.data, { flag: "wx" });
    return { src: `/uploads/editor/${name}`, width: converted.info.width, height: converted.info.height, size: converted.data.length };
  }
  async function media() {
    const assets = [], publicRoot = await fs.realpath(path.join(root, "public"));
    async function walk(relative) {
      const target = path.join(publicRoot, relative);
      let entries;
      try {
        if ((await fs.lstat(target)).isSymbolicLink() || !(await fs.realpath(target)).startsWith(publicRoot + path.sep)) return;
        entries = await fs.readdir(target, { withFileTypes: true });
      } catch { return; }
      for (const entry of entries) {
        if (assets.length >= 2000) return;
        if (entry.isSymbolicLink()) continue;
        const local = path.posix.join(relative, entry.name);
        if (entry.isDirectory()) await walk(local);
        else if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) assets.push({ src: `/${local}`, name: entry.name, size: (await fs.stat(path.join(publicRoot, local))).size });
      }
    }
    await walk("images"); await walk("uploads");
    return { assets };
  }
  return async function handle(request, response) {
    const url = new URL(request.url, origin);
    if (!url.pathname.startsWith("/__editor/api/")) return false;
    function json(status, payload) { response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); response.end(JSON.stringify(payload)); }
    try {
      const requestOrigin = origins.get(request.headers.host);
      if (!requestOrigin || request.headers.origin && request.headers.origin !== requestOrigin || request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin") throw new EditorError(403, "Yêu cầu phải cùng origin.");
      if (request.method === "GET" && url.pathname === "/__editor/api/status") { json(200, { enabled: true, token, uploadDirectory: "public/uploads/editor" }); return true; }
      const supplied = Buffer.from(String(request.headers["x-editor-token"] || "")), expected = Buffer.from(token);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new EditorError(401, "Phiên editor đã hết hạn. Hãy tải lại trang.");
      if (request.method !== "GET" && request.headers.origin !== requestOrigin) throw new EditorError(403, "Origin không hợp lệ.");
      if (request.method === "GET" && url.pathname === "/__editor/api/content") { const current = await read(); json(200, { data: current.data, revision: current.revision }); }
      else if (request.method === "GET" && url.pathname === "/__editor/api/media") json(200, await media());
      else if (request.method === "GET" && url.pathname === "/__editor/api/rsvps") { const current = await read(); json(200, { ...await listRsvps(root), mail: { configured: mailConfigured(), enabled: current.data.mail.enabled } }); }
      else if (request.method === "POST" && url.pathname === "/__editor/api/upload") json(201, await upload(request));
      else if (request.method === "PUT" && url.pathname === "/__editor/api/content") {
        if (String(request.headers["content-type"]).split(";")[0] !== "application/json") throw new EditorError(415, "Cần Content-Type application/json.");
        let input;
        try { input = JSON.parse((await body(request, 2 * 1024 * 1024)).toString("utf8")); } catch (error) { if (error instanceof EditorError) throw error; throw new EditorError(400, "JSON không hợp lệ."); }
        const pending = queue.then(() => save(input));
        queue = pending.catch(() => {});
        json(200, await pending);
      } else json(405, { error: "Phương thức không hỗ trợ." });
    } catch (error) { if (!(error instanceof EditorError)) console.error(error); json(error instanceof EditorError ? error.status : 500, { error: error instanceof EditorError ? error.message : "Không thể đọc hoặc lưu dữ liệu." }); }
    return true;
  };
}
