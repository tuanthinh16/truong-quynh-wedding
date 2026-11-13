"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { WeddingData } from "@/config/wedding";

const WeddingContext = createContext<{ data: WeddingData; preview: boolean } | null>(null);

export function WeddingContentProvider({ value, children, preview = true }: { value: WeddingData; children: ReactNode; preview?: boolean }) {
  return <WeddingContext.Provider value={{ data: value, preview }}>{children}</WeddingContext.Provider>;
}

function useWeddingContext() {
  const context = useContext(WeddingContext);
  if (!context) throw new Error("WeddingContentProvider is required.");
  return context;
}

export function useWedding() { return useWeddingContext().data; }
export function useWeddingPreview() { return useWeddingContext().preview; }

export function editable(...path: (string | number)[]) {
  return { "data-edit": JSON.stringify(path) };
}
