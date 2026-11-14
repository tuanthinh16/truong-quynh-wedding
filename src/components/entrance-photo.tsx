"use client";

import { getWeddingImageProps } from "./wedding-image";
import { editable } from "./wedding-content";
import { landscapePhotoQuery, useLandscapePhoto } from "./use-landscape-photo";

export default function EntrancePhoto({ portrait, landscape, alt }: {
  portrait: string; landscape: string; alt: string;
}) {
  const desktop = useLandscapePhoto();
  const common = { alt, fill: true, loading: "eager" as const, fetchPriority: "high" as const };
  const { props: desktopProps } = getWeddingImageProps({ ...common, src: landscape || portrait, sizes: "100vw" });
  const { props: mobileProps } = getWeddingImageProps({ ...common, src: portrait, sizes: "100vw" });

  return <picture className="viewport-photo" {...editable("photos", desktop ? "entranceLandscape" : "roses")}>
    <source media={landscapePhotoQuery} srcSet={desktopProps.srcSet || desktopProps.src} sizes={desktopProps.sizes} />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img {...mobileProps} alt={alt} className="welcome-background" />
  </picture>;
}
