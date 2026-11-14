"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import { fontFamily } from "@/lib/presentation.mjs";
import { useWedding } from "./wedding-content";

export function WeddingBlock({ block, as: Element = "section", children, ...props }: HTMLAttributes<HTMLElement> & { block: string; as?: "section" | "div" | "footer" }) {
  const settings = useWedding().presentation.blocks[block];
  if (settings?.visible === false) return null;
  const family = fontFamily(settings?.font);
  const style = family ? { ...props.style, "--font-block": family, "--font-body": family, "--font-display": family, "--font-script": family, "--font-names": family, fontFamily: family } as CSSProperties : props.style;
  return <Element {...props} data-wedding-block={block} style={style}>{children}</Element>;
}
