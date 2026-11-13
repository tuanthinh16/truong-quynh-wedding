/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import type { MediaAsset } from "@/lib/editor-types";

export function MediaLibraryGrid({ assets, usedSources = [], selectedSrc, onChoose }: {
  assets: MediaAsset[]; usedSources?: string[]; selectedSrc?: string; onChoose: (src: string) => void;
}) {
  const used = new Set(usedSources);
  const [visibleCount, setVisibleCount] = useState(24);
  const more = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = more.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setVisibleCount(count => Math.min(count + 24, assets.length));
    }, { root: element.closest(".ed-library"), rootMargin: "160px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [visibleCount, assets.length]);
  return <><div className="ed-library-grid">{assets.slice(0, visibleCount).map(asset => {
    const inGallery = used.has(asset.src);
    const selected = asset.src === selectedSrc;
    const status = inGallery ? "Đã có trong gallery" : selected ? "Đang chọn" : "";
    return <button type="button" key={asset.src} title={status ? `${asset.name} · ${status}` : asset.src} disabled={inGallery || selected} data-gallery-used={inGallery || undefined} data-library-selected={selected || undefined} aria-label={status ? `${asset.name} · ${status}` : asset.name} onClick={() => { if (!inGallery && !selected) onChoose(asset.src); }}>
      {asset.thumbnailSrc ? <img src={asset.thumbnailSrc} alt="" width={256} height={256} loading="lazy" decoding="async" /> : <span className="ed-library-placeholder">Chưa có ảnh xem trước</span>}
      <span>{asset.name}</span>
      {status && <strong className="ed-library-status">{status}</strong>}
    </button>;
  })}</div>{visibleCount < assets.length && <button type="button" className="ed-library-more" ref={more} onClick={() => setVisibleCount(count => Math.min(count + 24, assets.length))}>Xem thêm ảnh · {Math.min(visibleCount, assets.length)}/{assets.length}</button>}</>;
}
