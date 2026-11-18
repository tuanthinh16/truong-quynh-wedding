"use client";

import { type WeddingSide } from "@/config/wedding";
import { useWedding, editable } from "./wedding-content";
import { formatWeddingDate } from "./wedding-date";
import HeroSlideshow from "./hero-slideshow";
import { useLandscapePhoto } from "./use-landscape-photo";
import "./wedding-hero.css";

export default function WeddingHero({ side }: { side: WeddingSide }) {
  const wedding = useWedding();
  const event = wedding.events[side];
  const dateField = side === "bride" ? "ceremonyDateTime" : "dateTime";
  const dateTime = event[dateField];
  const date = dateTime ? formatWeddingDate(dateTime) : null;
  const copy = wedding.experience.hero;
  const desktop = useLandscapePhoto();
  const portraitPhotos = wedding.photos.heroSlides[side];
  const landscapePhotos = wedding.photos.heroLandscapeSlides[side];
  const photos = desktop && landscapePhotos.length ? landscapePhotos : portraitPhotos;
  const photoList = desktop ? "heroLandscapeSlides" : "heroSlides";
  const slides = photos.length ? photos : [{ src: wedding.photos.hero, alt: wedding.photos.heroAlt }];

  return <section className="botanical-hero" aria-labelledby="invitation-title">
    <div className="hero-composition">
      <div className="hero-paper mobile-photo-scene">
        <div className="hero-portrait" {...editable("photos", photoList, side)}>
          <HeroSlideshow key={`${photoList}-${JSON.stringify(slides)}`} photos={slides} />
        </div>
        <div className="hero-lettering">
          <h1 id="invitation-title" className="hero-names"><span {...editable("groom", "name")}>{wedding.groom.name}</span><i>&</i><span {...editable("bride", "name")}>{wedding.bride.name}</span></h1>
          <p className="hero-kicker" {...editable("experience", "hero", "eyebrow")}>{copy.eyebrow}</p>
          {date && <time className="hero-event-time" dateTime={dateTime ?? undefined} aria-label={`${date.full} dương lịch`} {...editable("events", side, dateField)}>{date.day}.{date.month}.{date.year} DL</time>}
        </div>
      </div>
    </div>
  </section>;
}
