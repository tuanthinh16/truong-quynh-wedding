import weddingData from "@/data/wedding.json";

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
  schedule: { time: string; title: string; detail: string; icon: string }[];
};

// Added 2026-11-12: JSON is the only editable content source; each family owns its event details.
export type WeddingData = Omit<typeof weddingData, "events"> & {
  events: Record<WeddingSide, WeddingEvent>;
};
export const wedding: WeddingData = weddingData;

export function albumPhotos(data: WeddingData): (WeddingPhoto & { label: string })[] {
  return [...data.photos.story.map(photo => ({ ...photo, label: photo.alt })), ...data.photos.gallery];
}
