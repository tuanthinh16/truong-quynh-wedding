"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { type WeddingSide, type WeddingPhoto } from "@/config/wedding";
import { useWedding, editable } from "./wedding-content";
import Icon, { type IconName } from "./icon";
import FloralArt from "./floral-art";
import WeddingCalendar from "./wedding-calendar";
import { formatWeddingDate } from "./wedding-date";
import WeddingHero from "./wedding-hero";
import WeddingPlayback from "./wedding-playback";
import WeddingGift from "./wedding-gift";
import { useWeddingAudio } from "./wedding-audio";

const RsvpDialog = dynamic(() => import("./rsvp-dialog"));
const GalleryDialog = dynamic(() => import("./gallery-dialog"));

function Ornament() {
  return <div className="ornament" aria-hidden="true"><span /><Icon name="heart" size={15} /><span /></div>;
}

function SectionHeading({ content }: { content: { eyebrow: string; title: string; accent: string; description: string } }) {
  return <div className="section-heading reveal"><span className="eyebrow">{content.eyebrow}</span><h2>{content.title} <em>{content.accent}</em></h2><p>{content.description}</p></div>;
}

function ScrollPhoto({ src, alt, sizes, position }: { src: string; alt: string; sizes: string; position?: string }) {
  const [loadedSource, setLoadedSource] = useState<string | null>(null);

  return <Image src={src} alt={alt} fill sizes={sizes} loading="lazy" className={loadedSource === src ? "is-loaded" : undefined} style={{ objectPosition: position }} onLoad={() => setLoadedSource(src)} />;
}

function PhotoButton({ photo, index, className, onOpen, sizes = "(min-width: 1200px) 560px, (min-width: 600px) 45vw, 85vw" }: {
  photo: WeddingPhoto; index: number; className: string; onOpen: (index: number) => void; sizes?: string;
}) {
  const wedding = useWedding();
  const copy = wedding.content;
  const photoPath = index < wedding.photos.story.length ? ["photos", "story", index, "src"] : ["photos", "gallery", index - wedding.photos.story.length, "src"];
  return (
    <button className={`photo-button photo-reveal ${className}`} data-edit={JSON.stringify(photoPath)} onClick={() => onOpen(index)} aria-label={`${copy.gallery.view} ${photo.alt}`}>
      <ScrollPhoto src={photo.src} alt={photo.alt} sizes={sizes} position={photo.position} />
      <span className="photo-open" aria-hidden="true"><Icon name="arrow" size={18} /></span>
    </button>
  );
}

export default function WeddingInvitation({ side }: { side: WeddingSide }) {
  const wedding = useWedding();
  const copy = wedding.content;
  const { startMusic, pauseMusic } = useWeddingAudio();
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState("");
  const pageRef = useRef<HTMLDivElement>(null);
  const event = wedding.events[side];
  const date = event.dateTime ? formatWeddingDate(event.dateTime) : null;

  useEffect(() => {
    void startMusic();
    return pauseMusic;
  }, [startMusic, pauseMusic]);

  useEffect(() => {
    const root = pageRef.current;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    root?.classList.add("motion-ready");
    root?.querySelectorAll(".reveal, .photo-reveal").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  async function shareInvitation() {
    const url = new URL(side === "groom" ? "/nha-trai" : "/nha-gai", window.location.origin).href;
    try { await navigator.clipboard.writeText(url); setShareStatus(copy.footer.copied); }
    catch { setShareStatus(`${copy.footer.link} ${url}`); }
  }

  return (
    <div className="invitation-page" ref={pageRef}>
      <a className="skip-link" href="#loi-moi">{copy.invitation.skip}</a>
      <main>
        <WeddingHero side={side} />

        <section id="loi-moi" className="wedding-details section-space">
          <FloralArt className="details-floral" />
          <div className="family-names reveal"><div><span className="eyebrow">{wedding.groom.role}</span><h2>{wedding.groom.name}</h2></div><Icon name="rings" size={37} /><div><span className="eyebrow">{wedding.bride.role}</span><h2>{wedding.bride.name}</h2></div></div>
          <div className={`date-invitation-grid content-width reveal${date ? "" : " without-calendar"}`}>
            {event.dateTime && <WeddingCalendar date={event.dateTime.slice(0, 10)} />}
            <div className="dinner-invitation">
              <Ornament /><span className="eyebrow">{copy.invitation.eyebrow}</span>
              <h2>{copy.invitation.title} <em>{copy.invitation.accent}</em></h2>
              <p>{copy.invitation.description}</p>
              {date && <><p className="dinner-time">{copy.invitation.atTime} <strong {...editable("events", side, "dateTime")}>{date.time}</strong> · {date.weekday}</p><div className="dinner-date" {...editable("events", side, "dateTime")}><span>{date.day}</span><i /><span>{date.month}</span><i /><span>{date.year}</span></div></>}
              {event.lunarDate && <p className="lunar-date" {...editable("events", side, "lunarDate")}>{copy.invitation.lunarPrefix} {event.lunarDate}</p>}
              <div className="dinner-location">{event.venue && <span className="eyebrow" {...editable("events", side, "venue")}>{copy.invitation.atVenue} {event.venue.toLocaleUpperCase("vi-VN")}</span>}{event.address && <p {...editable("events", side, "address")}>{event.address}</p>}</div>
              {event.mapUrl && <a className="button button-red" href={event.mapUrl} target="_blank" rel="noopener noreferrer"><Icon name="pin" size={17} />{copy.invitation.map}</a>}
            </div>
          </div>
          <p className="invitation-closing reveal">{copy.invitation.closing}</p>
        </section>

        <section id="chung-minh" className="partner-section section-space">
          <div className="section-heading reveal"><span className="eyebrow" {...editable("content", "partner", "eyebrow")}>{copy.partner.eyebrow}</span><p {...editable("content", "partner", "intro")}>{copy.partner.intro}</p></div>
          <div className="couple-grid content-width">
            {(["groom", "bride"] as const).map(personKey => {
              const person = wedding[personKey];
              return <article className="couple-card" key={personKey}>
                <div className="portrait-composition torn-portrait"><div className="partner-photo photo-reveal" {...editable(personKey, "portrait")}><ScrollPhoto src={person.portrait} alt={`${person.role} ${person.name}`} sizes="(min-width: 900px) 400px, (min-width: 600px) 42vw, 85vw" /></div></div>
                <div className="partner-copy reveal"><span className="partner-role" {...editable(personKey, "role")}>{person.role}</span><h2 {...editable(personKey, "name")}>{person.name}</h2><div className="short-rule" /><p {...editable(personKey, "introduction")}>{person.introduction}</p></div>
              </article>;
            })}
          </div>
          <blockquote className="couple-quote content-width reveal" {...editable("content", "partner", "quote")}>{copy.partner.quote}</blockquote>
        </section>

        {event.schedule.length > 0 && <section id="lich-trinh" className="schedule-section section-space">
          <div className="section-heading reveal">{date && <span className="eyebrow">{date.full}</span>}<h2>{copy.schedule.title} <em>{copy.schedule.accent}</em></h2><p>{event.label}</p></div>
          <ol className="wedding-timeline content-width">{event.schedule.map((item, index) => <li key={`${item.time}-${index}`} className="reveal"><span className="timeline-number">{String(index + 1).padStart(2, "0")}</span><div className="timeline-icon" {...editable("events", side, "schedule", index, "icon")}><Icon name={item.icon as IconName} size={25} /></div><time {...editable("events", side, "schedule", index, "time")}>{item.time}</time><h3 {...editable("events", side, "schedule", index, "title")}>{item.title}</h3><p {...editable("events", side, "schedule", index, "detail")}>{item.detail}</p></li>)}</ol>
        </section>}

        <section id="khoanh-khac" className="photo-story section-space">
          <SectionHeading content={copy.story} />
          <div className="editorial-story content-width">
            <span className="editorial-name editorial-name-first">{wedding.groom.name}</span>
            <div className="editorial-photos">{wedding.photos.story.map((photo, index) => <figure key={`${photo.src}-${index}`} className="editorial-frame"><PhotoButton photo={photo} index={index} className="editorial-photo" onOpen={setGalleryIndex} sizes="(min-width: 1000px) 435px, (min-width: 700px) 300px, 43vw" /></figure>)}</div>
            <span className="editorial-name editorial-name-second">{wedding.bride.name}</span>
            <FloralArt className="editorial-floral" />
          </div>
        </section>

        <section id="album" className="album-section section-space">
          <SectionHeading content={copy.album} />
          <div className="album-mosaic content-width">{wedding.photos.gallery.map((photo, index) => <figure className="mosaic-frame" key={`${photo.src}-${index}`}><PhotoButton photo={photo} index={wedding.photos.story.length + index} className="mosaic-photo" onOpen={setGalleryIndex} sizes={index === 0 ? "(min-width: 1200px) 700px, (min-width: 700px) 55vw, 90vw" : "(min-width: 1200px) 450px, 45vw"} /></figure>)}</div>
        </section>

        <section id="hoi-dap" className="reply-section section-space">
          <FloralArt className="reply-floral" /><div className="reply-content reveal"><span className="eyebrow">{copy.reply.eyebrow}</span><h2>{copy.reply.title}<br /><em>{copy.reply.accent}</em></h2><p>{copy.reply.description}</p><WeddingGift side={side} /><div className="reply-actions"><button className="button button-red" onClick={() => setRsvpOpen(true)}>{copy.reply.button} <Icon name="arrow" size={18} /></button></div></div>
          {event.address && <div className="reply-location content-width">
            <div className="location-map reveal" {...editable("events", side, "address")}>
              <div className="location-map-heading"><span className="eyebrow" {...editable("events", side, "sideLabel")}>{event.sideLabel}</span><p {...editable("events", side, "address")}>{event.address}</p></div>
              <iframe key={event.address} title={`${copy.invitation.map} · ${event.sideLabel} · ${event.address}`} src={`https://www.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
          </div>}
        </section>

        <footer className="invitation-footer"><span className="eyebrow">{copy.footer.eyebrow}</span><div className="footer-names">{wedding.groom.shortName} <span>&</span> {wedding.bride.shortName}</div>{date && <p>{date.day} . {date.month} . {date.year}</p>}<Ornament /><blockquote>{copy.footer.quote}</blockquote><button className="share-button" onClick={shareInvitation}><Icon name="copy" size={15} />{copy.footer.share} {event.sideLabel.toLocaleLowerCase("vi-VN")}</button><p className="share-status" role="status">{shareStatus}</p><div className="footer-bottom"><span>{copy.footer.signature}</span></div></footer>
      </main>

      <WeddingPlayback dialogOpen={rsvpOpen || galleryIndex !== null} />
      {rsvpOpen && <RsvpDialog side={side} onClose={() => setRsvpOpen(false)} />}
      {galleryIndex !== null && <GalleryDialog initialIndex={galleryIndex} onClose={() => setGalleryIndex(null)} />}
    </div>
  );
}
