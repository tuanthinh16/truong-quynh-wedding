import type weddingData from "@/data/wedding.defaults.json";
import album from "@/data/album.json";

export type WeddingSide = "groom" | "bride";
export type WeddingPhoto = { src: string; alt: string; position?: string };
export type WeddingEvent = {
  sideLabel: string;
  label: string;
  venue: string;
  address: string;
  dateTime: string | null;
  lunarDate: string;
  mapUrl: string | null;
  schedule: { time: string; title: string; detail: string; icon: string; date: string }[];
  locationImage: string;
  // Added 2026-11-13: independently editable embed URL, separate from the directions link/address.
  mapEmbedUrl: string | null;
  // Added 2026-11-18: bride ceremony timing is independent of the reception dateTime.
  ceremonyDateTime?: string | null;
};

// Added 2026-11-12: JSON is the only editable content source; each family owns its event details.
export type WeddingData = Omit<typeof weddingData, "events" | "presentation" | "photos"> & {
  // Added 2026-11-14: independent hero slides for each family, with the original hero as fallback.
  photos: typeof weddingData.photos & {
    heroSlides: Record<WeddingSide, WeddingPhoto[]>;
    // Added 2026-11-14: landscape entrance photo independent of the mobile portrait.
    entranceLandscape: string;
    // Added 2026-11-14: independent full-screen desktop hero slides for each family.
    heroLandscapeSlides: Record<WeddingSide, WeddingPhoto[]>;
  };
  events: Record<WeddingSide, WeddingEvent>;
  presentation: {
    typography: { body: string; display: string; script: string; numbers?: string };
    blocks: Record<string, { visible: boolean; font: string }>;
  };
};

export function albumPhotos(data: WeddingData): (WeddingPhoto & { label: string })[] {
  const excluded = new Set([data.gifts.groom.qrImage, data.gifts.bride.qrImage, data.decoration.bouquet]);
  const photos = [...data.photos.story.map(photo => ({ ...photo, label: photo.alt })), ...data.photos.gallery, ...album.photos];
  const seen = new Set<string>();
  return photos.filter(photo => {
    if (excluded.has(photo.src) || seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });
}
