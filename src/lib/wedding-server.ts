import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { WeddingData } from "@/config/wedding";

async function readWeddingData(): Promise<WeddingData> {
  return JSON.parse(await readFile(path.join(process.cwd(), "src/data/wedding.json"), "utf8"));
}

async function publishedWeddingData() {
  "use cache";
  return readWeddingData();
}

export const getWeddingData = cache(async (): Promise<WeddingData> => {
  return process.env.NODE_ENV === "development" ? readWeddingData() : publishedWeddingData();
});

export async function getWeddingMetadata(): Promise<Metadata> {
  const data = await getWeddingData();
  return { title: data.metadata.title, description: data.metadata.description, openGraph: { ...data.metadata.openGraph, type: "website" } };
}
