"use client";

import { useEffect, useRef, useState } from "react";
import Image from "./wedding-image";

export default function ViewportPhoto({ src, alt, sizes, position, className, eager = false, direction = "left" }: {
  src: string; alt: string; sizes: string; position?: string; className?: string;
  eager?: boolean; direction?: "left" | "right";
}) {
  const frame = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(eager);
  const [visible, setVisible] = useState(eager);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries.at(-1);
      if (!entry) return;
      setActive(entry.isIntersecting);
      if (!entry.isIntersecting) setLoadedSource(null);
    }, { rootMargin: "120px 0px", threshold: 0 });
    const visibilityObserver = new IntersectionObserver(entries => {
      const entry = entries.at(-1);
      if (entry) setVisible(entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(element);
    if (!eager) visibilityObserver.observe(element);
    return () => { observer.disconnect(); visibilityObserver.disconnect(); };
  }, [eager]);

  return <span ref={frame} className="viewport-photo" data-active={active} data-visible={visible} data-loaded={loadedSource === src} data-animate={!eager} data-direction={direction}>
    {active && <Image key={src} src={src} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} className={className} style={{ objectPosition: position }} onLoad={() => setLoadedSource(src)} />}
  </span>;
}
