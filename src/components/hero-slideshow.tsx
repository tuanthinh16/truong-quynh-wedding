"use client";

import { useEffect, useState } from "react";
import type { WeddingPhoto } from "@/config/wedding";
import Image from "./wedding-image";

export default function HeroSlideshow({ photos }: { photos: WeddingPhoto[] }) {
  const [index, setIndex] = useState(0);
  const multiple = photos.length > 1;
  const slides = multiple ? [...photos, photos[0]] : photos;

  useEffect(() => {
    if (!multiple) return;
    const timer = window.setInterval(() => setIndex(current => current >= photos.length ? 1 : current + 1), 2000);
    return () => window.clearInterval(timer);
  }, [multiple, photos.length]);

  useEffect(() => {
    if (!multiple || index !== photos.length) return;
    const timer = window.setTimeout(() => setIndex(0), 450);
    return () => window.clearTimeout(timer);
  }, [index, multiple, photos.length]);

  return <div className="hero-slideshow" role="img" aria-label={photos[0]?.alt}>
    <div className="hero-slide-track" style={{ transform: `translateX(-${index * 100}%)`, transition: index === 0 ? "none" : undefined }}>
      {slides.map((photo, slideIndex) => <div className="hero-slide" key={`${slideIndex}-${photo.src}`} aria-hidden="true">
        <Image className="hero-landscape" src={photo.src} alt="" fill sizes="(min-width: 1200px) 440px, (min-width: 700px) 38vw, 100vw" loading={slideIndex <= index + 1 ? "eager" : "lazy"} fetchPriority={slideIndex === 0 ? "high" : "auto"} style={{ objectPosition: photo.position }} />
      </div>)}
    </div>
  </div>;
}
