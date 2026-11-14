import { revalidateTag } from "next/cache";
import { createOnlineAdminAuth, readEditorJson } from "@/lib/editor-online-auth.mjs";
import { EditorError } from "@/lib/editor-validation.mjs";
import { fieldKind } from "@/lib/editor-schema.mjs";
import { getEditorMedia, weddingContentStore } from "@/lib/wedding-server";
import { weddingContentTag } from "@/lib/wedding-content-store.mjs";
import type { WeddingData } from "@/config/wedding";

async function verifyImages(data: WeddingData, previous: WeddingData) {
  const sources = new Set((await getEditorMedia()).map(asset => asset.src));
  function walk(value: unknown, before: unknown, path: (string | number)[] = []) {
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (!key.startsWith("_")) walk(child, before && typeof before === "object" ? (before as Record<string, unknown>)[key] : undefined, [...path, Array.isArray(value) ? Number(key) : key]);
      }
    } else if (typeof value === "string" && value && value !== before && fieldKind(path, value) === "image" && !sources.has(value)) {
      throw new EditorError(422, "Ảnh chưa có trên deployment. Hãy chọn ảnh có sẵn trong thư viện; upload mới chỉ dùng ở local.");
    }
  }
  walk(data, previous);
}

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
  try {
    const endpoint = (await context.params).path.join("/");
    const auth = createOnlineAdminAuth();
    if (endpoint === "auth/session" && request.method === "GET") return json({ configured: auth.configured, authenticated: Boolean(auth.requestSession(request)) });
    if (endpoint === "auth/login" && request.method === "POST") {
      auth.sameOrigin(request);
      const input = await readEditorJson(request, 4096);
      await weddingContentStore.limitLogin(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown");
      headers["Set-Cookie"] = auth.login(input, request);
      return json({ authenticated: true });
    }
    if (endpoint === "auth/logout" && request.method === "POST") {
      auth.sameOrigin(request);
      headers["Set-Cookie"] = auth.cookie("", request);
      return json({ authenticated: false });
    }
    const session = auth.authorize(request, request.method !== "GET");
    if (endpoint === "api/status" && request.method === "GET") return json({ token: session.token, storageConfigured: weddingContentStore.configured, uploadEnabled: false });
    if (endpoint === "api/content" && request.method === "GET") {
      const { data, revision } = await weddingContentStore.read();
      return json({ data, revision });
    }
    if (endpoint === "api/content" && request.method === "PUT") {
      const result = await weddingContentStore.save(await readEditorJson(request), verifyImages);
      revalidateTag(weddingContentTag, { expire: 0 });
      return json(result);
    }
    if (endpoint === "api/media" && request.method === "GET") return json({ assets: await getEditorMedia() });
    if (endpoint === "api/upload") throw new EditorError(403, "Upload mới chỉ khả dụng ở local. Trên Vercel hãy chọn ảnh có sẵn trong thư viện.");
    return json({ error: "Endpoint hoặc phương thức không hỗ trợ." }, 405);
  } catch (error) {
    if (error instanceof EditorError) return json({ error: error.message }, error.status);
    console.error("Online editor request failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Không thể xử lý yêu cầu lưu. Bản nháp vẫn được giữ, vui lòng thử lại." }, 500);
  }
}

export { handle as GET, handle as POST, handle as PUT };
