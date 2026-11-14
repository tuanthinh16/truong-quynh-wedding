"use client";

import { useEffect, type MouseEvent } from "react";
import { useWedding, editable } from "./wedding-content";
import Icon from "./icon";
import { useWeddingAudio } from "./wedding-audio";
import EntrancePhoto from "./entrance-photo";
import { GuestDedication, PersonalizedInvitationLink } from "./guest-personalization";
import { formatWeddingDate } from "./wedding-date";
import "./wedding-entrance.css";

export default function WeddingEntrance() {
  const wedding = useWedding();
  const date = wedding.content.entrance.date ? formatWeddingDate(wedding.content.entrance.date) : null;
  const { startMusic, pauseMusic } = useWeddingAudio();
  useEffect(() => { pauseMusic(); }, [pauseMusic]);

  function openInvitation(event: MouseEvent<HTMLAnchorElement>) {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) void startMusic();
  }
  return (
    <main className="welcome-screen mobile-photo-scene" aria-labelledby="entrance-title">
      <div className="welcome-portrait"><EntrancePhoto portrait={wedding.photos.roses} landscape={wedding.photos.entranceLandscape} alt={wedding.photos.entranceAlt} /></div>
      <div className="welcome-content">
        <div className="welcome-invitation">
          <GuestDedication />
          {date && <time className="welcome-invitation-date" dateTime={wedding.content.entrance.date} {...editable("content", "entrance", "date")}>{date.day} <span>·</span> {date.month} <span>·</span> {date.year} DL</time>}
        </div>
        <div className="welcome-footer">
        <h1 id="entrance-title" className="script-names">
          <span {...editable("groom", "name")}>{wedding.groom.name}</span>
          <span className="names-amp">&</span>
          <span {...editable("bride", "name")}>{wedding.bride.name}</span>
        </h1>
        <nav className="welcome-choices" aria-label={wedding.content.entrance.question}>
          <PersonalizedInvitationLink href="/nha-trai" onClick={openInvitation}><Icon name="rings" size={21} /><span>{wedding.events.groom.sideLabel}</span><Icon name="arrow" size={18} /></PersonalizedInvitationLink>
          <PersonalizedInvitationLink href="/nha-gai" onClick={openInvitation}><Icon name="flower" size={21} /><span>{wedding.events.bride.sideLabel}</span><Icon name="arrow" size={18} /></PersonalizedInvitationLink>
        </nav>
        </div>
      </div>
    </main>
  );
}
