"use client";

import { type WeddingSide } from "@/config/wedding";
import { useWedding, editable } from "./wedding-content";
import { formatWeddingDate } from "./wedding-date";
import ResponsiveCouplePhoto from "./responsive-couple-photo";
import HeroSlideshow from "./hero-slideshow";
import "./wedding-hero.css";

export default function WeddingHero({ side }: { side: WeddingSide }) {
  const wedding = useWedding();
  const event = wedding.events[side];
  const date = event.dateTime ? formatWeddingDate(event.dateTime) : null;
  const copy = wedding.experience.hero;

  return <section className="botanical-hero" aria-labelledby="invitation-title">
    <div className="hero-composition">
      <div className="hero-paper mobile-photo-scene">
        <div className="hero-portrait" {...editable("photos", "heroSlides", side)}>
          {wedding.photos.heroSlides[side].length ? <HeroSlideshow key={JSON.stringify(wedding.photos.heroSlides[side])} photos={wedding.photos.heroSlides[side]} /> : <ResponsiveCouplePhoto className="hero-landscape" src={wedding.photos.hero} alt={wedding.photos.heroAlt} />}
        </div>
        <div className="hero-lettering">
          {date && <time className="hero-day-month" dateTime={event.dateTime ?? undefined} aria-label={date.full} {...editable("events", side, "dateTime")}>{date.day}.{date.month}</time>}
          <h1 id="invitation-title" className="hero-names"><span {...editable("groom", "name")}>{wedding.groom.name}</span><i>&</i><span {...editable("bride", "name")}>{wedding.bride.name}</span></h1>
          <p className="hero-kicker"><span {...editable("events", side, "label")}>{event.label}</span> · <span {...editable("events", side, "sideLabel")}>{event.sideLabel}</span></p>
          {date && <p className="hero-event-time" {...editable("events", side, "dateTime")}><time dateTime={event.dateTime ?? undefined} aria-label={`${copy.timeLabel} ${date.time}`}>{date.time}</time> · {date.day}.{date.month}.{date.year}</p>}
        </div>
      </div>
    </div>
  </section>;
}
