import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { formatImageSize, imageSettings } from "../../src/lib/image-settings.mjs";
import { fieldKind } from "../../src/lib/editor-schema.mjs";
import { EditorError, validateContent } from "../../src/lib/editor-validation.mjs";
export { validateContent } from "../../src/lib/editor-validation.mjs";
import { listRsvps } from "../../src/lib/rsvp-service.mjs";
import { mailConfigured } from "../../src/lib/rsvp-mail.mjs";
import { withPresentation } from "../../src/lib/presentation.mjs";
import { createWeddingContentStore } from "../../src/lib/wedding-content-store.mjs";

// Added 2026-11-13: bounded, same-origin uploads and atomic JSON writes with revision checks and private backups.
const maxUpload = imageSettings.maxUploadBytes;
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
export const revisionOf = bytes => createHash("sha256").update(bytes).digest("hex");

async function body(request, limit, label = "Dữ liệu") {
  function tooLarge(size) { return new EditorError(413, `${label} vượt giới hạn ${formatImageSize(limit)} (yêu cầu ${formatImageSize(size)}).`); }
  if (Number(request.headers["content-length"]) > limit) throw tooLarge(Number(request.headers["content-length"]));
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > limit) throw tooLarge(length);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}


export function createEditorService({ root, origin, aliases = [], token }) {
  const origins = new Map([origin, ...aliases].map(value => [new URL(value).host, value]));
  const contentFile = path.join(root, "src/data/wedding.json");
  let queue = Promise.resolve();
  let mediaPending = null;
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
    return { data: withPresentation(JSON.parse(bytes.toString("utf8"))), revision: revisionOf(bytes), bytes };
  }
  async function save(input) {
    if (!input || typeof input !== "object" || Array.isArray(input) || typeof input.revision !== "string" || !input.data) throw new EditorError(400, "Cần nội dung và revision hợp lệ.");
    const current = await read();
    if (input.revision !== current.revision) throw new EditorError(409, "Nội dung đã thay đổi ở phiên khác. Tải lại dữ liệu trước khi lưu; bản nháp chưa bị ghi đè.");
    const next = withPresentation(structuredClone(input.data));
    validateContent(next, current.data);
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
    return writeLocal(current, next);
  }
  async function writeLocal(current, next) {
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
  async function syncFromRedis(input) {
    if (!input || typeof input.revision !== "string") throw new EditorError(400, "Cần revision local hợp lệ.");
    const current = await read();
    if (input.revision !== current.revision) throw new EditorError(409, "File local đã thay đổi. Tải lại dữ liệu trước khi đồng bộ.");
    const store = createWeddingContentStore({ readDefaults: async () => current.data });
    if (!store.configured) throw new EditorError(503, "Chưa cấu hình Redis trong .env.local. Cần dùng cùng database và WEDDING_CONTENT_KEY với Vercel.");
    const remote = await store.read();
    if (remote.raw === null) throw new EditorError(404, "Redis chưa có nội dung đã lưu. Không ghi đè file local bằng dữ liệu mặc định.");
    validateContent(remote.data, current.data);
    return writeLocal(current, remote.data);
  }
  async function upload(request) {
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(String(request.headers["content-type"]).split(";")[0])) throw new EditorError(415, "Chỉ nhận JPG, PNG, WebP hoặc AVIF.");
    const bytes = await body(request, maxUpload, "Ảnh upload");
    let converted;
    try {
      const image = sharp(bytes, { limitInputPixels: imageSettings.maxInputPixels, animated: false });
      const metadata = await image.metadata();
      if (!["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw new Error("format");
      converted = await image.rotate().resize({ width: imageSettings.maxUploadDimension, height: imageSettings.maxUploadDimension, fit: "inside", withoutEnlargement: true }).webp(request.headers["x-editor-image-purpose"] === "qr" ? { lossless: true } : { quality: imageSettings.uploadQuality }).toBuffer({ resolveWithObject: true });
    } catch { throw new EditorError(422, `Ảnh không hợp lệ hoặc vượt ${imageSettings.maxInputPixels / 1000000} megapixel. Dung lượng MB và độ phân giải MP là hai giới hạn khác nhau; hãy xuất lại ảnh với cạnh dài tối đa ${imageSettings.maxUploadDimension}px rồi upload.`); }
    const folder = await directory("public/uploads/editor");
    const name = `${randomUUID()}.webp`;
    await fs.writeFile(path.join(folder, name), converted.data, { flag: "wx" });
    const src = `/uploads/editor/${name}`;
    const thumbnailSrc = await thumbnail(path.join(folder, name), src, await fs.stat(path.join(folder, name)));
    return { src, thumbnailSrc, width: converted.info.width, height: converted.info.height, size: converted.data.length };
  }
  async function thumbnail(filename, src, stat) {
    const settings = { size: imageSettings.editorThumbnailSize, quality: imageSettings.editorThumbnailQuality, encoder: sharp.versions };
    const key = revisionOf(JSON.stringify({ src, size: stat.size, modified: stat.mtimeMs, settings }));
    const folder = await directory("public/optimized/editor-thumbnails");
    const output = path.join(folder, `${key}.webp`);
    const thumbnailSrc = `/optimized/editor-thumbnails/${key}.webp`;
    try { await fs.access(output); return thumbnailSrc; } catch (error) { if (error.code !== "ENOENT") throw error; }
    const temporary = `${output}.${randomUUID()}.tmp`;
    try {
      const bytes = await sharp(filename, { limitInputPixels: imageSettings.maxInputPixels, animated: false }).rotate().resize({ width: settings.size, height: settings.size, fit: "cover", withoutEnlargement: true }).webp({ quality: settings.quality }).toBuffer();
      await fs.writeFile(temporary, bytes, { flag: "wx" });
      await fs.rename(temporary, output);
    } finally { await fs.unlink(temporary).catch(() => {}); }
    return thumbnailSrc;
  }
  async function scanMedia() {
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
        else if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
          const filename = await fs.realpath(path.join(publicRoot, local));
          if (!filename.startsWith(publicRoot + path.sep)) continue;
          const stat = await fs.stat(filename);
          assets.push({ src: `/${local}`, name: entry.name, size: stat.size, filename, stat });
        }
      }
    }
    await walk("images"); await walk("uploads");
    let cursor = 0;
    const result = new Array(assets.length);
    await Promise.all(Array.from({ length: Math.min(assets.length, imageSettings.editorThumbnailConcurrency) }, async () => {
      while (cursor < assets.length) {
        const index = cursor++;
        const { filename, stat, ...asset } = assets[index];
        let thumbnailSrc = null;
        try { thumbnailSrc = await thumbnail(filename, asset.src, stat); }
        catch { console.warn(`Không thể tạo thumbnail: ${asset.src}`); }
        result[index] = { ...asset, thumbnailSrc };
      }
    }));
    return { assets: result };
  }
  function media() {
    if (!mediaPending) mediaPending = scanMedia().finally(() => { mediaPending = null; });
    return mediaPending;
  }
  return async function handle(request, response) {
    const url = new URL(request.url, origin);
    if (!url.pathname.startsWith("/__editor/api/")) return false;
    function json(status, payload) { response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); response.end(JSON.stringify(payload)); }
    try {
      const requestOrigin = origins.get(request.headers.host);
      if (!requestOrigin || request.headers.origin && request.headers.origin !== requestOrigin || request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin") throw new EditorError(403, "Yêu cầu phải cùng origin.");
      if (request.method === "GET" && url.pathname === "/__editor/api/status") { json(200, { enabled: true, token, uploadDirectory: "public/uploads/editor", maxUploadBytes: maxUpload, maxInputPixels: imageSettings.maxInputPixels, maxUploadDimension: imageSettings.maxUploadDimension }); return true; }
      const supplied = Buffer.from(String(request.headers["x-editor-token"] || "")), expected = Buffer.from(token);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new EditorError(401, "Phiên editor đã hết hạn. Hãy tải lại trang.");
      if (request.method !== "GET" && request.headers.origin !== requestOrigin) throw new EditorError(403, "Origin không hợp lệ.");
      if (request.method === "GET" && url.pathname === "/__editor/api/content") { const current = await read(); json(200, { data: current.data, revision: current.revision }); }
      else if (request.method === "GET" && url.pathname === "/__editor/api/media") json(200, await media());
      else if (request.method === "GET" && url.pathname === "/__editor/api/rsvps") { const current = await read(); json(200, { ...await listRsvps(root), mail: { configured: mailConfigured(), enabled: current.data.mail.enabled } }); }
      else if (request.method === "POST" && url.pathname === "/__editor/api/upload") json(201, await upload(request));
      else if (request.method === "PUT" && url.pathname === "/__editor/api/content" || request.method === "POST" && url.pathname === "/__editor/api/sync") {
        if (String(request.headers["content-type"]).split(";")[0] !== "application/json") throw new EditorError(415, "Cần Content-Type application/json.");
        let input;
        try { input = JSON.parse((await body(request, 2 * 1024 * 1024)).toString("utf8")); } catch (error) { if (error instanceof EditorError) throw error; throw new EditorError(400, "JSON không hợp lệ."); }
        const pending = queue.then(() => url.pathname === "/__editor/api/sync" ? syncFromRedis(input) : save(input));
        queue = pending.catch(() => {});
        json(200, await pending);
      } else json(405, { error: "Phương thức không hỗ trợ." });
    } catch (error) { if (!(error instanceof EditorError)) console.error(error); json(error instanceof EditorError ? error.status : 500, { error: error instanceof EditorError ? error.message : "Không thể đọc hoặc lưu dữ liệu." }); }
    return true;
  };
}
