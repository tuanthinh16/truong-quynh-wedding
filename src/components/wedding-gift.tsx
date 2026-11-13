"use client";

import Image from "next/image";
import type { WeddingSide } from "@/config/wedding";
import { editable, useWedding } from "./wedding-content";

export default function WeddingGift({ side }: { side: WeddingSide }) {
  const wedding = useWedding();
  const gift = wedding.gifts[side];
  const copy = wedding.content.gift;
  if (!gift.enabled || !gift.qrImage) return null;
  return <div className="gift-block">
    <div className="gift-intro" {...editable("content", "gift", "description")}>{copy.description.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    <details className="gift-disclosure" key={side}>
      <summary>
        <span className="gift-label" {...editable("content", "gift", "label")}>{copy.label}</span>
        <span className="gift-heart" {...editable("gifts", side, "qrImage")}>
          <svg viewBox="0 0 180 170" fill="none" aria-hidden="true">
            <path className="gift-heart-box" d="M90 151 27 94C-13 57 24 8 62 26c13 6 22 17 28 27 6-10 15-21 28-27 38-18 75 31 35 68Z" />
            <path className="gift-heart-lid" d="M90 135 31 82C1 54 30 15 62 31c13 7 22 18 28 29 6-11 15-22 28-29 32-16 61 23 31 51Z" />
            <path className="gift-heart-ribbon" d="M90 60v75M25 72c40 19 90 19 130 0" />
            <path className="gift-heart-bow" d="M90 70C48 68 54 34 75 46c11 6 15 24 15 24Zm0 0c42-2 36-36 15-24-11 6-15 24-15 24Z" />
            <path className="gift-heart-ribbon" d="m90 70-17 24m17-24 17 24" />
          </svg>
        </span>
      </summary>
      <div className="gift-qr" {...editable("gifts", side, "qrImage")}><Image src={gift.qrImage} alt={copy.qrAlt} width={600} height={600} unoptimized sizes="180px" style={{ objectFit: "contain" }} /></div>
    </details>
  </div>;
}
