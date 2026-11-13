"use client";

import Image from "next/image";
import { useWedding, editable } from "./wedding-content";

export default function FloralArt({ className = "" }: { className?: string }) {
  const wedding = useWedding();
  return (
    <Image
      className={`floral-art ${className}`}
      src={wedding.decoration.bouquet}
      {...editable("decoration", "bouquet")}
      alt=""
      aria-hidden="true"
      width={1112}
      height={748}
      sizes="(min-width: 900px) 480px, 330px"
    />
  );
}
