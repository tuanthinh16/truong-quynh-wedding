"use client";

import { editable, useWedding } from "./wedding-content";

export default function WeddingConcept() {
  const { partyConcept: concept } = useWedding();
  if (!concept?.enabled) return null;

  return <div className="party-concept content-width reveal" role="group" aria-label="Tone màu và trang phục">
    <p><span {...editable("partyConcept", "paletteLabel")}>{concept.paletteLabel}</span>: <span {...editable("partyConcept", "tones")}>{concept.tones}</span></p>
    <p><span {...editable("partyConcept", "dressCodeLabel")}>{concept.dressCodeLabel}</span>: <span {...editable("partyConcept", "dressCode")}>{concept.dressCode}</span></p>
  </div>;
}
