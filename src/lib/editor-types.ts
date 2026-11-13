import type { WeddingData } from "@/config/wedding";

export type { WeddingData };
export type EditorPath = (string | number)[];
export type FieldValue = string | number | boolean | null;
export interface EditorField {
  path: EditorPath;
  key: string;
  label: string;
  kind: "text" | "image" | "number" | "toggle" | "url" | "date" | "day" | "icon";
  nullable: boolean;
  value: FieldValue;
}
export interface EditorDocument {
  id: string;
  label: string;
  path: EditorPath;
  fields: EditorField[];
  lists: { path: EditorPath; label: string; max: number; min: number }[];
}
export interface MediaAsset { src: string; name: string; size: number; thumbnailSrc?: string | null }
