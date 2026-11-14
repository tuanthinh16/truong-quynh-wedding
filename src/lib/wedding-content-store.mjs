import { createHash } from "node:crypto";
import { EditorError, validateContent } from "./editor-validation.mjs";
import { withPresentation } from "./presentation.mjs";

export const weddingContentTag = "wedding-content";
const revisionOf = data => createHash("sha256").update(JSON.stringify(data)).digest("hex");

const saveScript = `
local current = redis.call('GET', KEYS[1])
if (current or '') ~= ARGV[1] then return 0 end
if current then
  redis.call('LPUSH', KEYS[2], current)
  redis.call('LTRIM', KEYS[2], 0, 19)
end
redis.call('SET', KEYS[1], ARGV[2])
return 1`;

export function createWeddingContentStore({ readDefaults, env = process.env, fetchImpl = fetch }) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  const key = env.WEDDING_CONTENT_KEY || "wedding:content:v1";
  const configured = Boolean(url && token);

  async function command(parts) {
    if (!configured) throw new EditorError(503, "Chưa kết nối kho lưu online. Cấu hình UPSTASH_REDIS_REST_URL và UPSTASH_REDIS_REST_TOKEN trên Vercel; bản nháp vẫn được giữ để thử lưu lại hoặc tải JSON sao lưu.");
    let response;
    try {
      const endpoint = new URL(url);
      if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(endpoint.hostname))) throw new Error("protocol");
      response = await fetchImpl(endpoint, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(parts), cache: "no-store", signal: AbortSignal.timeout(10000), redirect: "error",
      });
      if (!response.ok) throw new Error("storage");
      const result = await response.json();
      if (result.error || !Object.hasOwn(result, "result")) throw new Error("storage");
      return result.result;
    } catch {
      throw new EditorError(503, "Không thể kết nối kho dữ liệu online. Kiểm tra cấu hình lưu trữ rồi thử lại; bản nháp chưa bị xoá.");
    }
  }

  async function read() {
    const raw = configured ? await command(["GET", key]) : null;
    if (raw === null) {
      const data = withPresentation(await readDefaults());
      return { data, revision: revisionOf(data), raw: null };
    }
    try {
      const record = JSON.parse(raw);
      if (!record.data || typeof record.revision !== "string" || revisionOf(record.data) !== record.revision) throw new Error("record");
      return { data: withPresentation(record.data), revision: record.revision, raw };
    } catch {
      throw new EditorError(503, "Dữ liệu online không hợp lệ. Không tự ghi đè bằng dữ liệu mặc định; hãy kiểm tra bản sao lưu.");
    }
  }

  async function save(input, verifyImages) {
    if (!configured) return command([]);
    if (!input || typeof input !== "object" || typeof input.revision !== "string" || !input.data) throw new EditorError(400, "Cần nội dung và revision hợp lệ.");
    const current = await read();
    if (input.revision !== current.revision) throw new EditorError(409, "Nội dung đã thay đổi ở phiên khác. Tải lại dữ liệu trước khi lưu; bản nháp chưa bị ghi đè.");
    const next = withPresentation(structuredClone(input.data));
    validateContent(next, current.data);
    if (verifyImages) await verifyImages(next, current.data);
    next._meta = { ...current.data._meta, updatedAt: new Date().toISOString(), purpose: "2026-11-14: Nội dung lưu online bằng API admin; không phụ thuộc deploy hoặc file JSON trong Git." };
    const record = { data: next, revision: revisionOf(next) };
    const saved = await command(["EVAL", saveScript, "2", key, `${key}:history`, current.raw ?? "", JSON.stringify(record)]);
    if (saved !== 1) throw new EditorError(409, "Một phiên khác vừa lưu nội dung mới. Bản nháp của bạn vẫn được giữ; tải lại dữ liệu trước khi lưu tiếp.");
    return record;
  }

  async function limitLogin(identity) {
    const hash = createHash("sha256").update(identity).digest("hex");
    const script = "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], 900) end; return count";
    const count = await command(["EVAL", script, "1", `${key}:login:${hash}`]);
    if (count > 15) throw new EditorError(429, "Đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.");
  }

  return { configured, read, save, limitLogin };
}
