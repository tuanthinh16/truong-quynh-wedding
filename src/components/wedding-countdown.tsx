"use client";

import { useSyncExternalStore } from "react";
import { editable, useWedding } from "./wedding-content";

function subscribe(onChange: () => void) {
  const interval = window.setInterval(onChange, 1000);
  return () => window.clearInterval(interval);
}

function getSnapshot() { return Math.floor(Date.now() / 1000); }
function getServerSnapshot() { return null; }

export default function WeddingCountdown({ dateTime }: { dateTime: string | null }) {
  const copy = useWedding().content.countdown;
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const target = dateTime ? Date.parse(dateTime) / 1000 : NaN;
  if (!Number.isFinite(target)) return null;
  const remaining = now === null ? 0 : Math.max(0, Math.floor(target - now));
  const values = {
    days: Math.floor(remaining / 86400),
    hours: Math.floor(remaining / 3600) % 24,
    minutes: Math.floor(remaining / 60) % 60,
    seconds: remaining % 60,
  };

  return <div className="wedding-countdown" role="timer" aria-label={copy.label} aria-live="off">
    {(Object.keys(values) as (keyof typeof values)[]).map(unit => <div className="countdown-cell" key={unit}>
      <span className="countdown-value">{String(values[unit]).padStart(2, "0")}</span>
      <span className="countdown-unit" {...editable("content", "countdown", unit)}>{copy[unit]}</span>
    </div>)}
  </div>;
}
