import { isMapEmbedUrl } from "./map-embed.mjs";
import { fieldKind, listConfig } from "./editor-schema.mjs";
import { fontOptions, withPresentation } from "./presentation.mjs";

const icons = new Set(["heart", "arrow", "pin", "calendar", "check", "close", "chevron", "copy", "car", "flower", "rings", "image", "music", "play", "pause", "scroll"]);
const unsafeKeys = new Set(["__proto__", "constructor", "prototype"]);
export class EditorError extends Error {
  constructor(status, message) { super(message); this.status = status; }
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
      if (value === null && ["dateTime", "ceremonyDateTime", "mapUrl", "mapEmbedUrl"].includes(key)) return;
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
      if (trail[0] === "presentation" && key !== "visible" && !(key === "font" && value === "") && !fontOptions.some(font => font.id === value)) invalid("chọn font có sẵn trong thư viện.");
      if (kind === "image" && !(key === "qrImage" && value === "") && !/^\/(?!\/)(?!.*(?:\.\.|[\\?#\u0000-\u001f])).+\.(?:jpe?g|png|webp|avif)$/i.test(value)) invalid("chọn ảnh JPG, PNG, WebP hoặc AVIF trong public.");
      if (kind === "url" && value) { try { if (!["http:", "https:"].includes(new URL(value).protocol)) invalid("link chỉ hỗ trợ http/https."); } catch { invalid("link không hợp lệ."); } }
      if (key === "mapEmbedUrl" && value && !isMapEmbedUrl(value)) invalid("cần link HTTPS Google Maps nhúng. Vào Chia sẻ → Nhúng bản đồ và sao chép src của iframe, không dùng link rút gọn.");
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
  visit(input, withPresentation(baseline), []);
}
