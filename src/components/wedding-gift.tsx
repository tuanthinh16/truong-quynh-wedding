"use client";

import Image from "next/image";
import type { WeddingSide } from "@/config/wedding";
import { editable, useWedding } from "./wedding-content";

export default function WeddingGift({ side }: { side: WeddingSide }) {
  const wedding = useWedding();
  const gift = wedding.gifts[side];
  const copy = wedding.content.gift;
  if (!gift.enabled || !gift.qrImage) return null;
  return <div className="gift-block"><p className="gift-intro" {...editable("content", "gift", "description")}>{copy.description}</p><div className="gift-qr" {...editable("gifts", side, "qrImage")}><Image src={gift.qrImage} alt={copy.qrAlt} width={600} height={600} unoptimized sizes="180px" style={{ objectFit: "contain" }} /></div></div>;
}
