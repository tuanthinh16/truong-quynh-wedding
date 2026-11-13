"use client";

import Image from "next/image";
import { useId } from "react";
import { type WeddingSide } from "@/config/wedding";
import { useWedding, editable } from "./wedding-content";
import { formatWeddingDate } from "./wedding-date";
import FloralArt from "./floral-art";
import Icon from "./icon";

const framePath = "M12 116C12 52 65 23 126 46C181 76 206 65 253 35C320-5 433-4 500 35C567-4 680-5 747 35C794 65 819 76 874 46C935 23 988 52 988 116L988 872C988 934 942 966 877 945C817 925 779 938 734 959C665 992 572 979 500 951C428 979 335 992 266 959C221 938 183 925 123 945C58 966 12 934 12 872Z";

export default function WeddingHero({ side }: { side: WeddingSide }) {
  const wedding = useWedding();
  const event = wedding.events[side];
  const date = event.dateTime ? formatWeddingDate(event.dateTime) : null;
  const copy = wedding.experience.hero;
  const clipId = `wedding-frame-${useId().replaceAll(":", "")}`;

  return <section className="botanical-hero" aria-labelledby="invitation-title">
    <div className="hero-halo hero-halo-left" aria-hidden="true" /><div className="hero-halo hero-halo-right" aria-hidden="true" />
    <div className="hero-composition">
      <svg width="0" height="0" className="hero-definitions" aria-hidden="true"><defs><clipPath id={clipId} clipPathUnits="objectBoundingBox"><path d={framePath} transform="scale(.001)" /></clipPath></defs></svg>
      <div className="hero-paper" style={{ clipPath: `url(#${clipId})` }}>
        <Image className="hero-landscape" src={wedding.photos.hero} alt={wedding.photos.heroAlt} fill sizes="(min-width: 1440px) 1280px, 100vw" preload />
        <div className="hero-paper-wash" />
        <div className="hero-lettering">
          <p className="hero-kicker">{event.label} <span>·</span> {event.sideLabel}</p>
          <p className="hero-invitation">{wedding.content.invitation.invite}</p>
          <h1 id="invitation-title" className="hero-names"><span {...editable("groom", "name")}>{wedding.groom.name}</span><i>&</i><span {...editable("bride", "name")}>{wedding.bride.name}</span></h1>
          {date && <p className="hero-date" {...editable("events", side, "dateTime")}>{date.day} <span>/</span> {date.month} <span>/</span> {date.year}<time className="hero-time" dateTime={event.dateTime ?? undefined} aria-label={`${copy.timeLabel} ${date.time}`}>· {date.time}</time></p>}
          {event.lunarDate && <p className="hero-lunar" {...editable("events", side, "lunarDate")}>{wedding.content.invitation.lunarPrefix} {event.lunarDate}</p>}
          <p className="hero-venue">{event.mapUrl ? <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" {...editable("events", side, event.address ? "address" : "venue")}>{event.address || event.venue}<Icon name="pin" size={14} /></a> : <span {...editable("events", side, event.address ? "address" : "venue")}>{event.address || event.venue}</span>}</p>
          <a href="#loi-moi" className="hero-invite-button">{copy.button}<Icon name="arrow" size={15} /></a>
        </div>
        <svg className="hero-outline" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path d={framePath} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
      </div>
      <FloralArt className="hero-floral hero-floral-left" /><FloralArt className="hero-floral hero-floral-right" />
    </div>
    <div className="hero-keepsakes">
      {date && <div><Icon name="rings" size={27} /><span>{copy.dateLabel}</span><p>{date.full}</p></div>}
      {(event.address || event.venue) && <div><Icon name="pin" size={26} /><span>{copy.venueLabel}</span><p>{event.mapUrl ? <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" {...editable("events", side, event.address ? "address" : "venue")}>{event.address || event.venue}</a> : <span {...editable("events", side, event.address ? "address" : "venue")}>{event.address || event.venue}</span>}</p></div>}
      <div><Icon name="heart" size={26} /><span>{copy.loveLabel}</span><p>{wedding.groom.shortName} & {wedding.bride.shortName}</p></div>
    </div>
    <p className="hero-postscript">{copy.eyebrow}</p>
  </section>;
}
