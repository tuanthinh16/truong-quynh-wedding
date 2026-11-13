import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { wedding, type WeddingData } from "@/config/wedding";

export const getWeddingData = cache(async (): Promise<WeddingData> => {
  return wedding;
});

export async function getWeddingMetadata(): Promise<Metadata> {
  const data = await getWeddingData();
  return { title: data.metadata.title, description: data.metadata.description, openGraph: { ...data.metadata.openGraph, type: "website" } };
}
