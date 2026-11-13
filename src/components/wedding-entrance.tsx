"use client";

import Link from "next/link";
import { useEffect, type MouseEvent } from "react";
import { useWedding, editable } from "./wedding-content";
import FloralArt from "./floral-art";
import Icon from "./icon";
import { useWeddingAudio } from "./wedding-audio";
import ResponsiveCouplePhoto from "./responsive-couple-photo";

export default function WeddingEntrance() {
  const wedding = useWedding();
  const { startMusic, pauseMusic } = useWeddingAudio();
  useEffect(() => { pauseMusic(); }, [pauseMusic]);

  function openInvitation(event: MouseEvent<HTMLAnchorElement>) {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) void startMusic();
  }
  return (
    <main className="welcome-screen" aria-labelledby="entrance-title">
      <ResponsiveCouplePhoto className="welcome-background" landscape={wedding.photos.roses} portrait={wedding.photos.entrancePortrait} alt={wedding.photos.entranceAlt} />
      <FloralArt className="welcome-floral welcome-floral-left" />
      <FloralArt className="welcome-floral welcome-floral-right" />
      <div className="welcome-content">
        <p className="welcome-eyebrow">{wedding.content.entrance.eyebrow}</p>
        <h1 id="entrance-title" className="script-names">
          <span {...editable("groom", "name")}>{wedding.groom.name}</span>
          <span className="names-amp">&</span>
          <span {...editable("bride", "name")}>{wedding.bride.name}</span>
        </h1>
        <div className="welcome-divider" />
        <h2 id="choice-title">{wedding.content.entrance.question}</h2>
        <nav className="welcome-choices" aria-labelledby="choice-title">
          <Link href="/nha-trai" onClick={openInvitation}><Icon name="rings" size={21} /><span>{wedding.events.groom.sideLabel}</span><Icon name="arrow" size={18} /></Link>
          <Link href="/nha-gai" onClick={openInvitation}><Icon name="flower" size={21} /><span>{wedding.events.bride.sideLabel}</span><Icon name="arrow" size={18} /></Link>
        </nav>
        <div className="welcome-ornament" aria-hidden="true"><span /><Icon name="heart" size={16} /><span /></div>
      </div>
    </main>
  );
}
