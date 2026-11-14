import "server-only";
import { cache } from "react";
import { cacheTag } from "next/cache";
import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { WeddingData } from "@/config/wedding";
import type { MediaAsset } from "@/lib/editor-types";
import { withPresentation } from "@/lib/presentation.mjs";
import { createWeddingContentStore, weddingContentTag } from "@/lib/wedding-content-store.mjs";

async function readWeddingDefaults(): Promise<WeddingData> {
  const bytes = await readFile(path.join(process.cwd(), "src/data/wedding.json"), "utf8").catch(error => {
    if (error.code !== "ENOENT") throw error;
    return readFile(path.join(process.cwd(), "src/data/wedding.defaults.json"), "utf8");
  });
  return withPresentation(JSON.parse(bytes));
}

export const weddingContentStore = createWeddingContentStore({ readDefaults: readWeddingDefaults });

async function readWeddingData(): Promise<WeddingData> {
  return process.env.NODE_ENV === "development" ? readWeddingDefaults() : (await weddingContentStore.read()).data;
}

async function publishedWeddingData() {
  "use cache";
  cacheTag(weddingContentTag);
  return readWeddingData();
}

export const getWeddingData = cache(async (): Promise<WeddingData> => {
  return process.env.NODE_ENV === "development" ? readWeddingData() : publishedWeddingData();
});

export async function getEditorMedia(): Promise<MediaAsset[]> {
  return JSON.parse(await readFile(path.join(process.cwd(), ".generated/media.json"), "utf8"));
}

export async function getWeddingMetadata(): Promise<Metadata> {
  const data = await getWeddingData();
  return { title: data.metadata.title, description: data.metadata.description, openGraph: { ...data.metadata.openGraph, type: "website" } };
}
