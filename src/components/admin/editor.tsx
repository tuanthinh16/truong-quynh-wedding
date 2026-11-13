"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { editorDocuments, listConfig, readPath, writePath } from "@/lib/editor-schema.mjs";
import type { EditorDocument, EditorPath, FieldValue, MediaAsset, WeddingData } from "@/lib/editor-types";
import type { PreviewMessage } from "./preview";
import { FieldEditor } from "./field-editor";
import { InPageDialog } from "./in-page-dialog";
import { GuestResponses } from "./guest-responses";
import { InvitationLinks } from "./invitation-links";
import { GalleryInsert } from "./gallery-insert";
import { MediaLibraryGrid } from "./media-library-grid";
import { formatImageSize, imageSettings, validateUploadServer } from "@/lib/image-settings.mjs";

interface DraftState { data: WeddingData; base: WeddingData; revision: string; past: WeddingData[]; future: WeddingData[] }
const samePath = (first: EditorPath, second: EditorPath) => JSON.stringify(first) === JSON.stringify(second);

export function WeddingEditor({ initialData, readOnly = false }: { initialData: WeddingData; readOnly?: boolean }) {
  const router = useRouter();
  const [session, setSession] = useState<DraftState | null>(() => readOnly ? { data: initialData, base: initialData, revision: "deployment", past: [], future: [] } : null);
  const token = useRef("");
  const [busy, setBusy] = useState(false);
  const [maxUploadBytes, setMaxUploadBytes] = useState(imageSettings.maxUploadBytes);
  const [feedback, setFeedback] = useState({ text: "", error: false });
  const [page, setPage] = useState<PreviewMessage["page"]>("groom");
  const [mode, setMode] = useState<PreviewMessage["mode"]>("select");
  const [viewport, setViewport] = useState(1440);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 700 });
  const [documentId, setDocumentId] = useState("groom");
  const [selected, setSelected] = useState<EditorPath | null>(null);
  const [inspector, setInspector] = useState(false);
  const [responsesOpen, setResponsesOpen] = useState(false);
  const [invitationLinksOpen, setInvitationLinksOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [insertPositions, setInsertPositions] = useState<Record<string, number>>({});
  const [galleryInsertion, setGalleryInsertion] = useState<number | null>(null);
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const mediaCache = useRef<{ assets: MediaAsset[]; loaded: boolean; pending: Promise<MediaAsset[]> | null }>({ assets: [], loaded: false, pending: null });
  const [assetTarget, setAssetTarget] = useState<EditorPath | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const saveRef = useRef<() => void>(() => {});
  const documents = useMemo(() => session ? editorDocuments(session.data) as EditorDocument[] : [], [session]);
  const document = documents.find(doc => doc.id === documentId);
  const dirty = !!session && JSON.stringify(session.data) !== JSON.stringify(session.base);
  const notice = (text: string, error = false) => setFeedback({ text, error });

  const request = useCallback(async (url: string, options: RequestInit = {}, credential = token.current) => {
    const response = await fetch(`/__editor/api/${url}`, { ...options, cache: "no-store", headers: { "X-Editor-Token": credential, ...options.headers } });
    if (response.status === 401) { router.replace("/admin/login"); throw new Error("Phiên đăng nhập đã hết hạn."); }
    const result = await response.json().catch(() => { throw new Error("API editor chưa sẵn sàng. Kiểm tra deployment và cấu hình lưu trữ trên server."); });
    if (!response.ok) throw new Error(result.error || "Không thể thực hiện yêu cầu.");
    return result;
  }, [router]);

  const loadAssets = useCallback((): Promise<MediaAsset[]> => {
    const cache = mediaCache.current;
    if (cache.pending) return cache.pending;
    if (cache.loaded) return Promise.resolve(cache.assets);
    cache.pending = request("media").then((result: { assets: MediaAsset[] }) => {
      const merged = new Map(result.assets.map(asset => [asset.src, asset]));
      cache.assets.forEach(asset => merged.set(asset.src, asset));
      cache.assets = Array.from(merged.values());
      cache.loaded = true;
      return cache.assets;
    }).finally(() => { cache.pending = null; });
    return cache.pending;
  }, [request]);

  useEffect(() => {
    if (readOnly) return;
    let active = true;
    async function connect() {
      try {
        const status = await request("status");
        if (active && status.maxUploadBytes) setMaxUploadBytes(status.maxUploadBytes);
        const content = await request("content", {}, status.token);
        if (active) {
          token.current = status.token; setSession({ ...content, base: content.data, past: [], future: [] });
          void loadAssets().catch(error => { if (active) notice(error instanceof Error ? error.message : "Không thể tải thư viện ảnh. Mở thư viện để thử lại.", true); });
        }
      } catch (error) { if (active) notice(error instanceof Error ? error.message : "Không thể kết nối.", true); }
    }
    void connect();
    return () => { active = false; };
  }, [request, readOnly, loadAssets]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => { const size = entries[0].contentRect; setCanvasSize({ width: size.width, height: size.height }); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const sendPreview = useCallback(() => {
    if (session) frame.current?.contentWindow?.postMessage({ type: "wedding:render", state: { data: session.data, page, mode, selected, canInsertGallery: !readOnly && !busy } satisfies PreviewMessage }, location.origin);
  }, [session, page, mode, selected, readOnly, busy]);
  useEffect(() => { sendPreview(); }, [sendPreview]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "wedding:ready") sendPreview();
      if (event.data?.type === "wedding:save") saveRef.current();
      if (event.data?.type === "wedding:gallery-add" && session && !readOnly && !lock.current && session.data.photos.gallery.length < listConfig(["photos", "gallery"])!.max) {
        setDocumentId("photos"); setSelected(null); setGalleryInsertion(session.data.photos.gallery.length);
      }
      if (event.data?.type === "wedding:select" && !lock.current) {
        const path = event.data.path;
        if (!Array.isArray(path)) return;
        const target = documents.find(doc => doc.fields.some(field => samePath(field.path, path)));
        if (target) { setDocumentId(target.id); setSelected(path); setSearch(""); setInspector(true); }
      }
      if (event.data?.type === "wedding:navigate" && ["entrance", "groom", "bride"].includes(event.data.page)) setPage(event.data.page);
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [documents, sendPreview, session, readOnly]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);

  function change(path: EditorPath, value: FieldValue | unknown[]) {
    if (lock.current || readOnly) return;
    setSession(current => {
      if (!current || JSON.stringify(readPath(current.data, path)) === JSON.stringify(value)) return current;
      const next = structuredClone(current.data);
      writePath(next, path, value);
      return { ...current, data: next, past: [...current.past, current.data].slice(-30), future: [] };
    });
  }
  function history(direction: "undo" | "redo") {
    if (lock.current) return;
    setSelected(null);
    setSession(current => {
      if (!current) return current;
      if (direction === "undo" && current.past.length) return { ...current, data: current.past.at(-1)!, past: current.past.slice(0, -1), future: [current.data, ...current.future] };
      if (direction === "redo" && current.future.length) return { ...current, data: current.future[0], future: current.future.slice(1), past: [...current.past, current.data].slice(-30) };
      return current;
    });
  }
  const save = useCallback(async () => {
    if (!session || !dirty || lock.current || readOnly) return;
    lock.current = true; setBusy(true);
    try {
      const result = await request("content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: session.data, revision: session.revision }) });
      setSession(current => current ? { ...current, data: result.data, base: result.data, revision: result.revision } : current);
      notice("Đã lưu nội dung thiệp. Bản cũ được sao lưu trong .editor/history.");
    } catch (error) { notice(error instanceof Error ? error.message : "Lưu thất bại.", true); }
    finally { lock.current = false; setBusy(false); }
  }, [session, dirty, request, readOnly]);
  async function reloadContent() {
    if (lock.current || dirty && !window.confirm("Bỏ bản nháp và tải lại dữ liệu đã lưu?")) return;
    lock.current = true; setBusy(true);
    try {
      const result = await request("content");
      setSession({ data: result.data, base: result.data, revision: result.revision, past: [], future: [] });
      setSelected(null);
      notice("Đã tải dữ liệu mới nhất, không tải lại trang.");
    } catch (error) { notice(error instanceof Error ? error.message : "Không thể tải lại dữ liệu.", true); }
    finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => { saveRef.current = () => { void save(); }; }, [save]);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void save(); } }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [save]);

  async function uploadImage(file: File, purpose?: string) {
    if (lock.current || readOnly) return;
    if (file.size > maxUploadBytes) throw new Error(`Ảnh ${formatImageSize(file.size)} vượt giới hạn ${formatImageSize(maxUploadBytes)}. Hãy xuất ảnh với cạnh dài tối đa ${imageSettings.maxUploadDimension}px rồi upload lại.`);
    lock.current = true; setBusy(true);
    try {
      const status = await request("status");
      validateUploadServer(status);
      token.current = status.token;
      notice(`Đang upload ${formatImageSize(file.size)} và tối ưu ảnh…`);
      const result = await request("upload", { method: "POST", headers: { "Content-Type": file.type, ...(purpose === "qrImage" ? { "X-Editor-Image-Purpose": "qr" } : {}) }, body: file });
      const asset: MediaAsset = { src: result.src, name: result.src.split("/").at(-1), size: result.size, thumbnailSrc: result.thumbnailSrc };
      mediaCache.current.assets = [...mediaCache.current.assets.filter(existing => existing.src !== asset.src), asset];
      notice(`Đã tối ưu ${formatImageSize(file.size)} → ${formatImageSize(result.size)} (${result.width} × ${result.height}px). Bấm Lưu để dùng ảnh này trên thiệp.`);
      return result.src as string;
    }
    finally { lock.current = false; setBusy(false); }
  }
  async function upload(path: EditorPath, file: File) {
    try { const src = await uploadImage(file, String(path.at(-1))); if (src) change(path, src); }
    catch (error) { notice(error instanceof Error ? error.message : "Upload thất bại.", true); }
  }
  async function library(path: EditorPath) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { setAssets(await loadAssets()); setAssetTarget(path); }
    catch (error) { notice(error instanceof Error ? error.message : "Không thể mở thư viện.", true); }
    finally { lock.current = false; setBusy(false); }
  }
  function listChange(path: EditorPath, operation: "add" | "remove" | "up" | "down", index = 0) {
    if (!session || readOnly) return;
    const config = listConfig(path), items = structuredClone(readPath(session.data, path)) as unknown[];
    if (!config) return;
    if (operation === "add" && items.length < config.max) {
      const position = Math.max(0, Math.min(index, items.length));
      items.splice(position, 0, structuredClone(config.template));
      notice(`Đã chèn mục ở vị trí ${position + 1}. Chọn ảnh trong bản xem trước để thay ảnh hoặc upload.`);
    }
    else if (operation === "remove" && items.length > config.min) items.splice(index, 1);
    else if (operation === "up" && index > 0) [items[index - 1], items[index]] = [items[index], items[index - 1]];
    else if (operation === "down" && index < items.length - 1) [items[index + 1], items[index]] = [items[index], items[index + 1]];
    change(path, items); setSelected(null);
  }
  async function logout() {
    if (lock.current || dirty && !window.confirm("Bản nháp chưa lưu. Bạn vẫn muốn đăng xuất?")) return;
    try { const response = await fetch("/__editor/auth/logout", { method: "POST" }); if (!response.ok) throw new Error("Không thể đăng xuất."); router.replace("/admin/login"); }
    catch (error) { notice(error instanceof Error ? error.message : "Không thể đăng xuất.", true); }
  }
  const scale = Math.min(1, Math.max(1, canvasSize.width - 4) / viewport);
  const frameHeight = Math.max(480, Math.floor((canvasSize.height - 4) / scale));
  const selectedIsImage = document?.fields.some(field => selected && samePath(field.path, selected) && field.kind === "image");
  const selectedIsLocation = selected?.[0] === "events" && selected.length === 3 && ["address", "venue", "mapUrl", "mapEmbedUrl"].includes(String(selected.at(-1)));
  const visibleFields = document?.fields.filter(field => selected ? samePath(field.path, selected) || field.kind !== "image" && samePath(field.path.slice(0, -1), selected.slice(0, -1)) && (selectedIsImage || selectedIsLocation) : `${field.label} ${field.path.join(".")}`.toLowerCase().includes(search.toLowerCase())) || [];

  return <main className="ed-root">
    <header className="ed-topbar"><div className="ed-brand">Thiệp cưới<small>Visual editor</small></div>
      <label className="ed-route"><span className="ed-sr-only">Trang xem trước</span><select value={page} onChange={event => setPage(event.target.value as PreviewMessage["page"])}><option value="entrance">Màn mở đầu</option><option value="groom">Thiệp nhà trai</option><option value="bride">Thiệp nhà gái</option></select></label>
      <div className="ed-top-actions"><span className={`ed-connection ${session ? "connected" : ""}`}>{session ? dirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ" : "Đang kết nối…"}</span>
        <button disabled={!session || busy} onClick={() => { setSelected(null); setSearch(""); setInspector(true); }}>Nội dung</button>
        <button onClick={() => setInvitationLinksOpen(true)}>Tạo link mời</button>
        <details className="ed-tools"><summary>Tùy chọn</summary><div className="ed-tools-menu">
          <label>Khung xem<select value={viewport} onChange={event => setViewport(Number(event.target.value))}><option value={1440}>Desktop · 1440</option><option value={768}>Tablet · 768</option><option value={390}>Mobile · 390</option></select></label>
          <label>Chế độ<select value={mode} onChange={event => setMode(event.target.value as PreviewMessage["mode"])}><option value="select">Bấm để sửa</option><option value="browse">Duyệt thiệp</option></select></label>
          <div className="ed-history"><button disabled={!session?.past.length || busy} onClick={() => history("undo")}>Hoàn tác</button><button disabled={!session?.future.length || busy} onClick={() => history("redo")}>Làm lại</button></div>
          <button disabled={!session || busy} onClick={() => { setDocumentId("metadata"); setSelected(null); setInspector(true); }}>SEO & chia sẻ</button>
          <button disabled={!session || busy || readOnly} onClick={() => setResponsesOpen(true)}>Danh sách hồi đáp</button>
          <button disabled={busy || readOnly} onClick={() => void reloadContent()}>Tải lại dữ liệu</button>
          {!readOnly && <button disabled={busy} onClick={() => void logout()}>Đăng xuất</button>}
        </div></details><button className="ed-save" disabled={!dirty || busy} onClick={() => void save()}>{busy ? "Đang xử lý…" : "Lưu thay đổi"}</button>
      </div>
    </header>
    {readOnly && <div className="ed-feedback" role="status">Bản online chỉ xem trước, không upload hoặc lưu. Chỉnh sửa/upload bằng admin local, lưu rồi commit/push nội dung và ảnh. Deployment mới luôn dùng dữ liệu trong Git.</div>}
    {feedback.text && <div className={`ed-feedback ${feedback.error ? "is-error" : ""}`} role={feedback.error ? "alert" : "status"}><span>{feedback.text}</span><button aria-label="Đóng thông báo" onClick={() => notice("")}>×</button></div>}
    <section className="ed-workspace"><div className="ed-stage"><p className="ed-preview-hint">{mode === "select" ? "Bấm vào chữ hoặc ảnh trên thiệp để sửa · Mọi trường khác nằm trong Nội dung" : "Duyệt thiệp để mở album và form · Chọn Bấm để sửa khi cần chỉnh nội dung"}</p>
      <div ref={canvas} className="ed-canvas"><div className="ed-preview-surface" style={{ width: viewport * scale, height: frameHeight * scale }}><div className="ed-frame" style={{ width: viewport, height: frameHeight, transform: `scale(${scale})` }}><iframe ref={frame} title="Xem trước thiệp cưới — bản nháp" src="/admin/preview" onLoad={sendPreview} /></div></div></div>
    </div></section>
    {inspector && session && <InPageDialog className="ed-dialog" label="Chỉnh sửa nội dung" inactive={!!assets || galleryInsertion !== null} onClose={() => { if (!busy) setInspector(false); }}>
      <header><div><p className="ed-eyebrow">Bản nháp · xem trước tức thì</p><h2>{selected ? "Sửa ngay trên thiệp" : "Nội dung thiệp"}</h2></div><button disabled={busy} aria-label="Đóng chỉnh sửa" onClick={() => setInspector(false)}>×</button></header>
      <div className="ed-dialog-body"><label className="ed-document-label">Nhóm nội dung<select value={documentId} disabled={busy} onChange={event => { setDocumentId(event.target.value); setSelected(null); setSearch(""); }}>{documents.map(doc => <option key={doc.id} value={doc.id}>{doc.label}</option>)}</select></label>
        {documentId === "mail" && <p className="ed-config-help">Chỉ gửi cho khách chọn tham dự và nhập email. Dùng {"{name}, {couple}, {side}, {guests}"} để chèn thông tin. Cấu hình SMTP trong Environment Variables của Vercel rồi redeploy, hoặc .env.local khi chạy local; không nhập mật khẩu SMTP vào nội dung thiệp.</p>}
        {documentId.startsWith("gift-") && <p className="ed-config-help">Upload mã QR thật của đúng người nhận. Mỗi nhà dùng một ảnh riêng; có thể ẩn mã QR bằng Bật chức năng.</p>}
        {documentId.startsWith("event-") && <p className="ed-config-help">Địa chỉ là chữ hiển thị ở hero; Link bản đồ là URL Google Maps được mở khi bấm địa chỉ. Điền riêng cho nhà trai và nhà gái. Nội dung này cũng dùng trong email hướng dẫn.</p>}
        {selected ? <button className="ed-show-all" onClick={() => setSelected(null)}>Xem tất cả trường trong nhóm</button> : <input className="ed-search" aria-label="Tìm nội dung trong nhóm" placeholder="Tìm nội dung…" value={search} onChange={event => setSearch(event.target.value)} />}
        {!selected && document?.lists.map(list => {
          const items = readPath(session.data, list.path) as Record<string, unknown>[];
          const listKey = list.path.join(".");
          const insertion = Math.min(insertPositions[listKey] ?? items.length, items.length);
          const isPhotoList = list.path[0] === "photos";
          return <section className="ed-list" key={listKey}>
            <h3>{list.label} · {items.length}/{list.max}</h3>
            {items.map((item, index) => <div className="ed-list-row" key={index}>{isPhotoList && <img className="ed-list-thumb" src={String(item.src)} alt="" />}<span>{index + 1}. {String(item.title || item.alt || "Ảnh")}</span><button aria-label={`Chuyển mục ${index + 1} lên`} disabled={busy || readOnly || index === 0} onClick={() => listChange(list.path, "up", index)}>↑</button><button aria-label={`Chuyển mục ${index + 1} xuống`} disabled={busy || readOnly || index === items.length - 1} onClick={() => listChange(list.path, "down", index)}>↓</button><button aria-label={`Xóa mục ${index + 1}`} disabled={busy || readOnly || items.length <= list.min} onClick={() => listChange(list.path, "remove", index)}>Xóa</button></div>)}
            <label className="ed-insert-position">Vị trí chèn {isPhotoList ? "ảnh" : "mục"}
              <select value={insertion} disabled={busy || readOnly || items.length >= list.max} onChange={event => setInsertPositions(current => ({ ...current, [listKey]: Number(event.target.value) }))}>
                {Array.from({ length: items.length + 1 }, (_, index) => <option key={index} value={index}>{index === 0 ? "Đầu danh sách" : index === items.length ? `Cuối danh sách · vị trí ${index + 1}` : `Trước mục ${index + 1} · ${String(items[index].alt || items[index].title || "Ảnh")}`}</option>)}
              </select>
            </label>
            <p className="ed-config-help">{isPhotoList ? "Ảnh" : "Mục"} mới ở vị trí {insertion + 1}{insertion < items.length ? `; các mục từ ${insertion + 1} trở đi sẽ lùi xuống.` : ", sau mục cuối cùng."} Bản xem trước cập nhật ngay, chỉ công khai khi bấm Lưu.</p>
            <button disabled={busy || readOnly || items.length >= list.max} onClick={() => listKey === "photos.gallery" ? setGalleryInsertion(insertion) : listChange(list.path, "add", insertion)}>{listKey === "photos.gallery" ? "Chọn ảnh & xem trước" : `Thêm ${isPhotoList ? "ảnh" : "mục"} tại vị trí ${insertion + 1}`}</button>
          </section>;
        })}
        <div className="ed-fields">{visibleFields.map(field => <FieldEditor key={JSON.stringify(field.path)} field={field} disabled={busy || readOnly} maxUploadBytes={maxUploadBytes} change={value => change(field.path, value)} upload={file => void upload(field.path, file)} library={() => void library(field.path)} />)}{!visibleFields.length && <p>Không có trường phù hợp.</p>}</div>
      </div><footer><span>Thay đổi chỉ hiển thị trong bản xem trước cho đến khi bấm Lưu.</span>{feedback.text && <p className={feedback.error ? "ed-dialog-error" : ""} role={feedback.error ? "alert" : "status"}>{feedback.text}</p>}<button disabled={busy} onClick={() => setInspector(false)}>Xong</button><button className="ed-save" disabled={!dirty || busy} onClick={() => void save()}>{busy ? "Đang xử lý…" : "Lưu thay đổi"}</button></footer>
    </InPageDialog>}
    {assets && <InPageDialog className="ed-library" label="Thư viện ảnh" onClose={() => { setAssets(null); setAssetTarget(null); }}><header><div><p className="ed-eyebrow">Ảnh trong public</p><h2>Thư viện ảnh</h2></div><button aria-label="Đóng thư viện" onClick={() => { setAssets(null); setAssetTarget(null); }}>×</button></header><MediaLibraryGrid assets={assets} usedSources={assetTarget?.[0] === "photos" && assetTarget[1] === "gallery" ? session?.data.photos.gallery.map(photo => photo.src) : undefined} onChoose={source => { if (assetTarget) change(assetTarget, source); setAssets(null); setAssetTarget(null); }} />{!assets.length && <p>Chưa có ảnh. Upload ảnh từ bảng chỉnh sửa.</p>}</InPageDialog>}
    {galleryInsertion !== null && session && <GalleryInsert data={session.data} initialPosition={galleryInsertion} page={page === "entrance" ? "groom" : page} busy={busy} maxUploadBytes={maxUploadBytes} upload={uploadImage} loadAssets={loadAssets} onClose={() => { if (!lock.current) setGalleryInsertion(null); }} onInsert={(photo, position) => {
      if (lock.current || readOnly) return;
      const items = [...session.data.photos.gallery];
      const config = listConfig(["photos", "gallery"]);
      if (!config || items.length >= config.max) return;
      if (items.some(existing => existing.src === photo.src)) { notice("Ảnh này đã có trong gallery. Hãy chọn ảnh khác.", true); return; }
      items.splice(position, 0, photo);
      change(["photos", "gallery"], items);
      setGalleryInsertion(null); setSelected(["photos", "gallery", position, "src"]);
      setPage(page === "entrance" ? "groom" : page);
      notice(`Đã thêm ảnh vào gallery tại vị trí ${position + 1}. Bấm Lưu để lưu thay đổi.`);
    }} />}
    {responsesOpen && <GuestResponses request={request} onClose={() => setResponsesOpen(false)} />}
    {invitationLinksOpen && <InvitationLinks initialPath={page === "entrance" ? "/" : page === "bride" ? "/nha-gai" : "/nha-trai"} onClose={() => setInvitationLinksOpen(false)} />}
  </main>;
}
