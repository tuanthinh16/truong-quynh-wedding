import type weddingData from "@/data/wedding.defaults.json";

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
};

// Added 2026-11-12: JSON is the only editable content source; each family owns its event details.
export type WeddingData = Omit<typeof weddingData, "events" | "presentation" | "photos"> & {
  // Added 2026-11-14: independent hero slides for each family, with the original hero as fallback.
  photos: typeof weddingData.photos & { heroSlides: Record<WeddingSide, WeddingPhoto[]> };
  events: Record<WeddingSide, WeddingEvent>;
  presentation: {
    typography: { body: string; display: string; script: string; numbers?: string };
    blocks: Record<string, { visible: boolean; font: string }>;
  };
};

export function albumPhotos(data: WeddingData): (WeddingPhoto & { label: string })[] {
  return [...data.photos.story.map(photo => ({ ...photo, label: photo.alt })), ...data.photos.gallery];
}
