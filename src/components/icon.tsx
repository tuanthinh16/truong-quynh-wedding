import type { CSSProperties } from "react";

export type IconName = "heart" | "arrow" | "pin" | "calendar" | "check" | "close" | "chevron" | "copy" | "car" | "flower" | "rings" | "image" | "music" | "play" | "pause" | "scroll" | "volume" | "volume-off";
const paths: Record<IconName, string> = {
  volume: "M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  "volume-off": "M11 5 6 9H3v6h3l5 4V5Zm5 4 6 6m0-6-6 6",
  music: "M9 18V5l12-2v13M9 8l12-2M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-2a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z",
  play: "m9 5 11 7-11 7V5Z",
  pause: "M8 5v14M16 5v14",
  scroll: "M12 3v16m-5-5 5 5 5-5M5 22h14",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  check: "m5 12 4 4L19 6", close: "m6 6 12 12M6 18 18 6", chevron: "m6 9 6 6 6-6", copy: "M9 9h12v12H9V9ZM5 15H3V3h12v2",
  car: "m5 5-3 7v7h3v-3h14v3h3v-7l-3-7H5Zm-3 7h20M7 5l-2 7m12-7 2 7M6 14h1m10 0h1",
  flower: "M12 21v-8m0 5c-4 0-6-2-6-5 4 0 6 2 6 5Zm0-3c4 0 6-2 6-5-4 0-6 2-6 5ZM12 10C2 12 3 2 8 4c0-6 8-6 8 0 5-2 6 8-4 6Z",
  rings: "M14 14a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm8 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM7 5l2-3 2 3-2 3-2-3Zm8 0 2-3 2 3-2 3-2-3Z",
  image: "M3 3h18v18H3V3Zm0 13 6-6 5 5 3-3 4 4M16 7h.01",
};

export default function Icon({ name, size = 20, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>;
}
