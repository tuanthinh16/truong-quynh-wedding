"use client";

import ViewportPhoto from "./viewport-photo";
import RsvpDialog from "./rsvp-dialog";
import GalleryDialog from "./gallery-dialog";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { albumPhotos, type WeddingSide, type WeddingPhoto } from "@/config/wedding";
import { useWedding, editable } from "./wedding-content";
import Icon, { type IconName } from "./icon";
import FloralArt from "./floral-art";
import WeddingCalendar from "./wedding-calendar";
import { WeddingBlock } from "./wedding-block";
import { formatWeddingDate } from "./wedding-date";
import WeddingHero from "./wedding-hero";
import WeddingPlayback from "./wedding-playback";
import WeddingGift from "./wedding-gift";
import WeddingCountdown from "./wedding-countdown";
import { useWeddingAudio } from "./wedding-audio";
import { isMapEmbedUrl } from "@/lib/map-embed.mjs";
import { GuestDedication } from "./guest-personalization";
import { invitationHref } from "@/lib/guest-invitation";
import "./gallery-dialog.css";

function Ornament() {
  return <div className="ornament" aria-hidden="true"><span /><Icon name="heart" size={15} /><span /></div>;
}

function SectionHeading({ content, showTitle = true }: { content: { eyebrow: string; title: string; accent: string; description: string }; showTitle?: boolean }) {
  return <div className="section-heading reveal"><span className="eyebrow">{content.eyebrow}</span>{showTitle && <h2>{content.title} <em>{content.accent}</em></h2>}<p>{content.description}</p></div>;
}

function PhotoButton({ photo, index, className, onOpen, sizes = "(min-width: 1200px) 560px, (min-width: 600px) 45vw, 85vw" }: {
  photo: WeddingPhoto; index: number; className: string; onOpen: (index: number) => void; sizes?: string;
}) {
  const wedding = useWedding();
  const copy = wedding.content;
  const photoPath = index < wedding.photos.story.length ? ["photos", "story", index, "src"] : ["photos", "gallery", index - wedding.photos.story.length, "src"];
  return (
    <button className={`photo-button photo-reveal ${className}`} data-edit={JSON.stringify(photoPath)} onClick={() => onOpen(index)} aria-label={`${copy.gallery.view} ${photo.alt}`}>
      <ViewportPhoto src={photo.src} alt={photo.alt} sizes={sizes} position={photo.position} direction={index % 2 === 0 ? "left" : "right"} />
    </button>
  );
}

export default function WeddingInvitation({ side, galleryAppend }: { side: WeddingSide; galleryAppend?: ReactNode }) {
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
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { threshold: 0.08 });
    root?.classList.add("motion-ready");
    root?.querySelectorAll(".reveal").forEach(element => observer.observe(element));
    return () => { observer.disconnect(); root?.classList.remove("motion-ready"); };
  }, [wedding.presentation]);

  async function shareInvitation() {
    const url = new URL(invitationHref(side === "groom" ? "/nha-trai" : "/nha-gai", new URLSearchParams(window.location.search).get("name")), window.location.origin).href;
    try { await navigator.clipboard.writeText(url); setShareStatus(copy.footer.copied); }
    catch { setShareStatus(`${copy.footer.link} ${url}`); }
  }

  return (
    <div className="invitation-page" ref={pageRef}>
      <a className="skip-link" href={wedding.presentation.blocks.invitation.visible ? "#loi-moi" : "#noi-dung-thiep"}>{copy.invitation.skip}</a>
      <main id="noi-dung-thiep" tabIndex={-1}>
        <WeddingBlock block="hero" as="div"><WeddingHero side={side} /></WeddingBlock>

        <WeddingBlock block="invitation" id="loi-moi" className="wedding-details section-space">
          <FloralArt className="details-floral" />
          <div className="family-names reveal"><div><span className="eyebrow">{wedding.groom.role}</span><h2>{wedding.groom.name}</h2></div><Icon name="rings" size={37} /><div><span className="eyebrow">{wedding.bride.role}</span><h2>{wedding.bride.name}</h2></div></div>
          <div className="invitation-letter content-width reveal"><GuestDedication /><h2 {...editable("content", "invitation", "letterTitle")}>{copy.invitation.letterTitle}</h2><p {...editable("content", "invitation", "letterBody")}>{copy.invitation.letterBody}</p></div>
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
        </WeddingBlock>

        <WeddingBlock block="loveStory" id="chuyen-chung-minh" className="love-story-section section-space" aria-labelledby="love-story-title">
          <div className="love-story-copy content-width reveal">
            <span className="eyebrow" {...editable("content", "loveStory", "subtitle")}>{copy.loveStory.subtitle}</span>
            <h2 id="love-story-title" {...editable("content", "loveStory", "title")}>{copy.loveStory.title}</h2>
            <Ornament />
            <p {...editable("content", "loveStory", "description")}>{copy.loveStory.description}</p>
          </div>
        </WeddingBlock>

        <WeddingBlock block="partner" id="chung-minh" className="partner-section section-space" aria-label={copy.partner.eyebrow}>
          <div className="couple-profile content-width">
            <div className="portrait-composition"><div className="partner-photo photo-reveal" {...editable("photos", "couplePortrait")}><ViewportPhoto src={wedding.photos.couplePortrait} alt={wedding.photos.coupleAlt} sizes="(min-width: 900px) 480px, 85vw" /></div></div>
            <div className="partner-copy couple-profile-copy reveal">
              <span className="eyebrow" {...editable("content", "partner", "eyebrow")}>{copy.partner.eyebrow}</span>
              <h2><span {...editable("groom", "name")}>{wedding.groom.name}</span><i aria-hidden="true"> & </i><span {...editable("bride", "name")}>{wedding.bride.name}</span></h2>
              <Ornament />
              <blockquote {...editable("content", "partner", "quote")}>{copy.partner.quote}</blockquote>
            </div>
          </div>
        </WeddingBlock>

        {event.schedule.length > 0 && <WeddingBlock block="schedule" id="lich-trinh" className="schedule-section section-space">
          <div className="section-heading reveal"><h2 {...editable("content", "schedule", "title")}>{copy.schedule.title}</h2></div>
          <ol className="wedding-timeline content-width">{event.schedule.map((item, index) => {
            const milestoneDate = item.date ? formatWeddingDate(item.date) : null;
            return <li key={`${item.date}-${item.time}-${index}`} className="reveal"><span className="timeline-number">{String(index + 1).padStart(2, "0")}</span><div className="timeline-icon" {...editable("events", side, "schedule", index, "icon")}><Icon name={item.icon as IconName} size={25} /></div><time dateTime={item.date ? `${item.date}T${item.time}:00+07:00` : undefined} {...editable("events", side, "schedule", index, "time")}>{item.time}</time>{milestoneDate && <span className="timeline-day" {...editable("events", side, "schedule", index, "date")}>{milestoneDate.day}/{milestoneDate.month}/{milestoneDate.year}</span>}<h3 {...editable("events", side, "schedule", index, "title")}>{item.title}</h3><p {...editable("events", side, "schedule", index, "detail")}>{item.detail}</p></li>;
          })}</ol>
        </WeddingBlock>}

        <WeddingBlock block="story" id="khoanh-khac" className="photo-story section-space">
          <SectionHeading content={copy.story} showTitle={false} />
          <div className="editorial-story content-width">
            <div className="editorial-photos">{wedding.photos.story.map((photo, index) => <figure key={`${photo.src}-${index}`} className="editorial-frame"><PhotoButton photo={photo} index={index} className="editorial-photo" onOpen={setGalleryIndex} sizes="(min-width: 1000px) 435px, (min-width: 700px) 300px, 43vw" /></figure>)}</div>
            <FloralArt className="editorial-floral" />
          </div>
        </WeddingBlock>

        <WeddingBlock block="album" id="album" className="album-section section-space">
          <SectionHeading content={copy.album} />
          <div className="album-mosaic content-width">{wedding.photos.gallery.map((photo, index) => <figure className="mosaic-frame" key={`${photo.src}-${index}`}><PhotoButton photo={photo} index={wedding.photos.story.length + index} className="mosaic-photo" onOpen={setGalleryIndex} sizes={index === 0 ? "(min-width: 1200px) 700px, (min-width: 700px) 55vw, 90vw" : "(min-width: 1200px) 450px, 45vw"} /></figure>)}{galleryAppend}</div>
          {albumPhotos(wedding).length > 0 && <div className="album-library-action"><button className="button button-red" onClick={() => setGalleryIndex(0)}><Icon name="image" size={18} /> Xem thư viện ảnh</button></div>}
        </WeddingBlock>

        <WeddingBlock block="reply" id="hoi-dap" className="reply-section section-space">
          <FloralArt className="reply-floral" /><div className="reply-content reveal"><span className="eyebrow" {...editable("content", "reply", "eyebrow")}>{copy.reply.eyebrow}</span><h2><span {...editable("content", "reply", "title")}>{copy.reply.title}</span><br /><em {...editable("content", "reply", "accent")}>{copy.reply.accent}</em></h2><div className="reply-message" {...editable("content", "reply", "description")}>{copy.reply.description.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><div className="reply-actions"><button className="button button-red" onClick={() => setRsvpOpen(true)}><span {...editable("content", "reply", "button")}>{copy.reply.button}</span> <Icon name="arrow" size={18} /></button></div><WeddingGift side={side} /></div>
        </WeddingBlock>
        {event.address && <WeddingBlock block="location" id="dia-chi" className="reply-section section-space location-section">
          <div className="reply-location content-width">
            <div className="location-time reveal">{date && event.dateTime && <time dateTime={event.dateTime} {...editable("events", side, "dateTime")}>{date.time}</time>}{event.lunarDate && <p><span {...editable("content", "invitation", "lunarPrefix")}>{copy.invitation.lunarPrefix}</span> <span {...editable("events", side, "lunarDate")}>{event.lunarDate}</span></p>}</div>
            <div className="location-portrait photo-reveal" {...editable("events", side, "locationImage")}><ViewportPhoto src={event.locationImage} alt={copy.invitation.locationImageAlt} sizes="(min-width: 1100px) 456px, 44vw" direction="right" /></div>
            <div className="location-map reveal" {...editable("events", side, "mapEmbedUrl")}>
              <div className="location-map-heading"><h2 {...editable("content", "invitation", "locationTitle")}>{copy.invitation.locationTitle}</h2><h3 {...editable("events", side, "venue")}>{event.venue}</h3><p {...editable("events", side, "address")}>{event.address}</p></div>
              {event.mapEmbedUrl && isMapEmbedUrl(event.mapEmbedUrl) && <iframe key={event.mapEmbedUrl} title={`${copy.invitation.map} · ${event.sideLabel} · ${event.address}`} src={event.mapEmbedUrl} {...editable("events", side, "mapEmbedUrl")} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />}
            </div>
            <WeddingCountdown dateTime={event.dateTime} />
          </div>
        </WeddingBlock>}

        <WeddingBlock block="footer" as="footer" className="invitation-footer"><span className="eyebrow">{copy.footer.eyebrow}</span><div className="footer-names">{wedding.groom.shortName} <span>&</span> {wedding.bride.shortName}</div>{date && <p>{date.day} . {date.month} . {date.year}</p>}<Ornament /><blockquote>{copy.footer.quote}</blockquote><GuestDedication thanks /><button className="share-button" onClick={shareInvitation}><Icon name="copy" size={15} />{copy.footer.share} {event.sideLabel.toLocaleLowerCase("vi-VN")}</button><p className="share-status" role="status">{shareStatus}</p><div className="footer-bottom"><span>{copy.footer.signature}</span></div></WeddingBlock>
      </main>

      <WeddingPlayback dialogOpen={rsvpOpen || galleryIndex !== null} />
      {rsvpOpen && <RsvpDialog side={side} onClose={() => setRsvpOpen(false)} />}
      {galleryIndex !== null && <GalleryDialog initialIndex={galleryIndex} onClose={() => setGalleryIndex(null)} />}
    </div>
  );
}
