"use client";

import { createContext, useContext, type ReactNode } from "react";
import { wedding, type WeddingData } from "@/config/wedding";

const WeddingContext = createContext({ data: wedding as WeddingData, preview: false });

export function WeddingContentProvider({ value, children, preview = true }: { value: WeddingData; children: ReactNode; preview?: boolean }) {
  return <WeddingContext.Provider value={{ data: value, preview }}>{children}</WeddingContext.Provider>;
}

export function useWedding() { return useContext(WeddingContext).data; }
export function useWeddingPreview() { return useContext(WeddingContext).preview; }

export function editable(...path: (string | number)[]) {
  return { "data-edit": JSON.stringify(path) };
}
