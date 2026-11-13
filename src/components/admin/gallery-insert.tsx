"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MediaAsset, WeddingData } from "@/lib/editor-types";
import { listConfig } from "@/lib/editor-schema.mjs";
import { formatImageSize } from "@/lib/image-settings.mjs";
import type { PreviewMessage } from "./preview";
import { InPageDialog } from "./in-page-dialog";
import { MediaLibraryGrid } from "./media-library-grid";

type GalleryPhoto = WeddingData["photos"]["gallery"][number];

export function GalleryInsert({ data, initialPosition, page, busy, maxUploadBytes, upload, loadAssets, onClose, onInsert }: {
  data: WeddingData; initialPosition: number; page: "groom" | "bride"; busy: boolean; maxUploadBytes: number;
  upload: (file: File) => Promise<string | undefined>;
  loadAssets: () => Promise<MediaAsset[]>;
  onClose: () => void; onInsert: (photo: GalleryPhoto, position: number) => void;
}) {
  const [position, setPosition] = useState(Math.min(initialPosition, data.photos.gallery.length));
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewport, setViewport] = useState(1440);
  const [width, setWidth] = useState(600);
  const frame = useRef<HTMLIFrameElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const pending = busy || loading;
  const usedSources = data.photos.gallery.map(photo => photo.src);
  const duplicate = usedSources.includes(src);
  const preview = useMemo(() => {
    const next = structuredClone(data);
    const template = listConfig(["photos", "gallery"])!.template as GalleryPhoto;
    next.photos.gallery.splice(position, 0, { ...template, src: src || template.src, alt: alt.trim() || "Ảnh mới" });
    return next;
  }, [data, position, src, alt]);
  const sendPreview = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: "wedding:render", state: { data: preview, page, mode: "select", selected: null, galleryInsertion: position } satisfies PreviewMessage }, location.origin);
  }, [preview, page, position]);
  useEffect(() => { sendPreview(); }, [sendPreview]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin === location.origin && event.source === frame.current?.contentWindow && event.data?.type === "wedding:ready") sendPreview();
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [sendPreview]);
  useEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);

  async function chooseFile(file: File) {
    setError(""); setLoading(true);
    try { const uploaded = await upload(file); if (uploaded) setSrc(uploaded); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Không thể upload ảnh."); }
    finally { setLoading(false); }
  }
  async function openLibrary() {
    setError(""); setLoading(true);
    try { setAssets(await loadAssets()); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Không thể mở thư viện."); }
    finally { setLoading(false); }
  }
  const scale = Math.min(1, Math.max(1, width) / viewport);
  return <>
    <InPageDialog className="ed-dialog ed-gallery-insert" label="Thêm ảnh vào gallery" inactive={assets !== null} onClose={() => { if (!pending) onClose(); }}>
      <header><div><p className="ed-eyebrow">Gallery · ảnh mới</p><h2>Chọn ảnh & vị trí chèn</h2></div><button disabled={pending} aria-label="Đóng thêm ảnh" onClick={onClose}>×</button></header>
      <div className="ed-dialog-body ed-gallery-layout">
        <div className="ed-gallery-form">
          <div className="ed-image-actions"><label className="ed-upload">Upload ảnh<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={pending} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void chooseFile(file); }} /></label><button disabled={pending} onClick={() => void openLibrary()}>Thư viện ảnh</button></div>
          <small>Tối đa {formatImageSize(maxUploadBytes)}. Upload chỉ lưu tệp; ảnh chưa được thêm vào gallery.</small>
          {src && <img className="ed-gallery-chosen" src={src} alt={alt || "Ảnh đang chọn"} />}
          <label>Mô tả ảnh<input value={alt} disabled={pending} onChange={event => setAlt(event.target.value)} placeholder="Khoảnh khắc ngày cưới" /></label>
          <label>Vị trí chèn<select value={position} disabled={pending} onChange={event => setPosition(Number(event.target.value))}>{Array.from({ length: data.photos.gallery.length + 1 }, (_, index) => <option key={index} value={index}>{index === 0 ? "Đầu gallery · vị trí 1" : index === data.photos.gallery.length ? `Cuối gallery · vị trí ${index + 1}` : `Trước ảnh ${index + 1} · ${data.photos.gallery[index].alt}`}</option>)}</select></label>
          <p className="ed-config-help" role="status">Khối viền đỏ là ảnh mới ở vị trí {position + 1}. {src ? "Đang xem ảnh đã chọn." : "Đang dùng ảnh minh họa; hãy chọn ảnh để xác nhận."} Các ảnh phía sau tự dịch chuyển theo bố cục gallery.</p>
          {pending && <p role="status">Đang xử lý ảnh…</p>}
          {error && <p className="ed-dialog-error" role="alert">{error}</p>}
        </div>
        <div className="ed-gallery-preview"><label>Khung xem<select value={viewport} onChange={event => setViewport(Number(event.target.value))}><option value={1440}>Desktop · 1440</option><option value={390}>Mobile · 390</option></select></label><div className="ed-gallery-canvas" ref={canvas}><iframe ref={frame} title="Xem trước vị trí ảnh mới trong gallery" src="/admin/preview" onLoad={sendPreview} style={{ width: viewport, height: 480 / scale, transform: `scale(${scale})` }} /></div></div>
      </div>
      <footer><span>Chỉ thêm vào bản nháp khi xác nhận. Bấm Lưu ở admin để lưu thay đổi.</span><button disabled={pending} onClick={onClose}>Hủy</button><button className="ed-save" disabled={pending || !src || duplicate} onClick={() => { if (!duplicate) onInsert({ ...listConfig(["photos", "gallery"])!.template, src, alt: alt.trim() || "Khoảnh khắc ngày cưới" } as GalleryPhoto, position); }}>Thêm ảnh tại vị trí {position + 1}</button></footer>
    </InPageDialog>
    {assets && <InPageDialog className="ed-library" label="Chọn ảnh cho gallery" onClose={() => setAssets(null)}><header><h2>Thư viện ảnh</h2><button aria-label="Đóng thư viện" onClick={() => setAssets(null)}>×</button></header><p>Ảnh có viền và nhãn Đã có trong gallery không thể chọn lại.</p><MediaLibraryGrid assets={assets} usedSources={usedSources} selectedSrc={src} onChoose={source => { setSrc(source); setAssets(null); }} />{!assets.length && <p>Chưa có ảnh. Hãy upload ảnh mới.</p>}</InPageDialog>}
  </>;
}
