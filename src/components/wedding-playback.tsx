"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useWedding } from "./wedding-content";
import { useWeddingAudio } from "./wedding-audio";
import Icon from "./icon";

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export default function WeddingPlayback({ dialogOpen }: { dialogOpen: boolean }) {
  const wedding = useWedding();
  const { isPlaying, startMusic, pauseMusic } = useWeddingAudio();
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const [preference, setPreference] = useState<"auto" | "on" | "off">("auto");
  const scrollRequested = preference === "on" || (preference === "auto" && !reducedMotion);
  const autoScrolling = isPlaying && scrollRequested && !dialogOpen;
  const copy = wedding.experience.controls;

  useEffect(() => {
    if (!autoScrolling) return;
    let frame = 0;
    let previousTime = 0;
    let elapsed = 0;
    let position = window.scrollY;
    const { pixelsPerSecond, rampMilliseconds } = wedding.experience.scroll;

    function tick(time: number) {
      const delta = previousTime ? Math.min(time - previousTime, 64) : 0;
      previousTime = time;
      if (!document.hidden) {
        elapsed += delta;
        const progress = Math.min(elapsed / Math.max(rampMilliseconds, 1), 1);
        const speed = pixelsPerSecond * progress * (2 - progress);
        position = Math.min(position + speed * delta / 1000, Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
        window.scrollTo({ top: position, behavior: "instant" });
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1) {
          setPreference("off");
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    }

    function stop(event: Event) {
      if (event.type !== "wheel" && event.target instanceof Element && event.target.closest(".wedding-playback")) return;
      setPreference("off");
    }
    function onKey(event: KeyboardEvent) {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Escape", "Tab"].includes(event.key)) stop(event);
    }

    frame = requestAnimationFrame(tick);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("pointerdown", stop, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", onKey);
    };
  }, [autoScrolling, wedding.experience.scroll]);

  function toggleMusic() {
    if (isPlaying) pauseMusic();
    else { setPreference("auto"); void startMusic(); }
  }

  function toggleScroll() {
    if (autoScrolling) setPreference("off");
    else { setPreference("on"); if (!isPlaying) void startMusic(); }
  }

  return <div className="wedding-playback" role="group" aria-label={copy.label}>
    <button type="button" onClick={toggleMusic} aria-label={isPlaying ? copy.pause : copy.play} aria-pressed={isPlaying} title={isPlaying ? copy.pause : copy.play}>
      <Icon name={isPlaying ? "music" : "play"} size={19} />
      <span className={`sound-bars${isPlaying ? " is-playing" : ""}`} aria-hidden="true"><i /><i /><i /></span>
    </button>
    <span className="playback-divider" aria-hidden="true" />
    <button type="button" onClick={toggleScroll} aria-label={autoScrolling ? copy.scrollPause : copy.scrollStart} aria-pressed={autoScrolling} title={autoScrolling ? copy.scrollPause : copy.scrollStart}>
      <Icon name={autoScrolling ? "pause" : "scroll"} size={18} />
    </button>
  </div>;
}
