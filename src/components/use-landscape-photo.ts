"use client";

import { useSyncExternalStore } from "react";

export const landscapePhotoQuery = "(min-width: 700px)";

function subscribe(callback: () => void) {
  const media = window.matchMedia(landscapePhotoQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function desktopSnapshot() { return window.matchMedia(landscapePhotoQuery).matches; }
function serverSnapshot() { return false; }

export function useLandscapePhoto() {
  return useSyncExternalStore(subscribe, desktopSnapshot, serverSnapshot);
}
