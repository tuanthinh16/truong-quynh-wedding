import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { wedding, type WeddingData } from "@/config/wedding";
import { cloudConfigured } from "./cloud-store.mjs";
import { cloudEditor } from "./cloud-runtime";

export const getWeddingData = cache(async (): Promise<WeddingData> => {
  await connection();
  return cloudConfigured() ? (await cloudEditor.content()).data : wedding;
});

export async function getWeddingMetadata(): Promise<Metadata> {
  const data = await getWeddingData();
  return { title: data.metadata.title, description: data.metadata.description, openGraph: { ...data.metadata.openGraph, type: "website" } };
}
