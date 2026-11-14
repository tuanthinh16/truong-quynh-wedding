"use client";

import Image from "./wedding-image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { albumPhotos } from "@/config/wedding";
import { useWedding } from "./wedding-content";
import Modal from "./modal";
import Icon from "./icon";

export default function GalleryDialog({ initialIndex, onClose }: { initialIndex: number; onClose: () => void }) {
  const wedding = useWedding();
  const photos = albumPhotos(wedding);
  const source = [...wedding.photos.story, ...wedding.photos.gallery][initialIndex]?.src;
  const [page, setPage] = useState(() => ({ index: Math.max(0, photos.findIndex(photo => photo.src === source)), direction: 1, turn: 0 }));
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const wheel = useRef({ distance: 0, time: 0 });
  const count = photos.length;
  const index = count ? page.index % count : 0;
  const photo = photos[index];
  const turn = useCallback((direction: number) => {
    if (count < 2) return;
    setPage(current => ({ index: (current.index + direction + count) % count, direction, turn: current.turn + 1 }));
  }, [count]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        turn(event.key === "ArrowRight" ? 1 : -1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  function endGesture(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId) return;
    const horizontal = event.clientX - start.x;
    const vertical = event.clientY - start.y;
    if (Math.abs(horizontal) >= 45 && Math.abs(horizontal) > Math.abs(vertical) * 1.25) turn(horizontal < 0 ? 1 : -1);
  }

  return <Modal onClose={onClose} label={wedding.content.gallery.label} className="gallery-modal album-book-modal">
    <header className="album-book-heading"><span className="eyebrow">OUR WEDDING ALBUM</span><h2>{wedding.content.gallery.label}</h2></header>
    {photo ? <>
      <div className="album-book-stage" onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerUp={endGesture} onPointerCancel={() => { gesture.current = null; }} onLostPointerCapture={() => { gesture.current = null; }} onWheel={event => {
        if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        const now = Date.now();
        if (now - wheel.current.time < 500) return;
        wheel.current.distance += event.deltaX;
        if (Math.abs(wheel.current.distance) >= 45) {
          turn(wheel.current.distance > 0 ? 1 : -1);
          wheel.current = { distance: 0, time: now };
        }
      }}>
        <div key={page.turn} className="album-book-page" data-direction={page.direction}>
          <div className="gallery-full-image"><Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1000px) 900px, 95vw" draggable={false} style={{ objectPosition: photo.position }} /></div>
        </div>
      </div>
      <div className="gallery-controls">
        <button onClick={() => turn(-1)} disabled={count < 2} aria-label={wedding.content.gallery.previous}><Icon name="arrow" style={{ transform: "rotate(180deg)" }} /></button>
        <p aria-live="polite" aria-atomic="true">{photo.label || photo.alt}<span>{index + 1} / {count}</span></p>
        <button onClick={() => turn(1)} disabled={count < 2} aria-label={wedding.content.gallery.next}><Icon name="arrow" /></button>
      </div>
    </> : <p>Chưa có ảnh trong album.</p>}
  </Modal>;
}
