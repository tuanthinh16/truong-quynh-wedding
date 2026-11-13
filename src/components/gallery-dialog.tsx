"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { albumPhotos } from "@/config/wedding";
import { useWedding } from "./wedding-content";
import Modal from "./modal";
import Icon from "./icon";

export default function GalleryDialog({ initialIndex, onClose }: { initialIndex: number; onClose: () => void }) {
  const wedding = useWedding();
  const [requestedIndex, setIndex] = useState(initialIndex);
  const photos = albumPhotos(wedding);
  const index = Math.min(requestedIndex, photos.length - 1);
  const photo = photos[index];
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") { event.preventDefault(); setIndex((current) => (Math.min(current, photos.length - 1) + 1) % photos.length); }
      if (event.key === "ArrowLeft") { event.preventDefault(); setIndex((current) => (Math.min(current, photos.length - 1) - 1 + photos.length) % photos.length); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length]);
  return <Modal onClose={onClose} label={wedding.content.gallery.label} className="gallery-modal"><div className="gallery-full-image"><Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1000px) 900px, 95vw" style={{ objectPosition: "position" in photo ? photo.position : undefined }} /></div><div className="gallery-controls"><button onClick={() => setIndex((index - 1 + photos.length) % photos.length)} aria-label={wedding.content.gallery.previous}><Icon name="arrow" style={{ transform: "rotate(180deg)" }} /></button><p aria-live="polite"><span>{index + 1} / {photos.length}</span></p><button onClick={() => setIndex((index + 1) % photos.length)} aria-label={wedding.content.gallery.next}><Icon name="arrow" /></button></div></Modal>;
}
