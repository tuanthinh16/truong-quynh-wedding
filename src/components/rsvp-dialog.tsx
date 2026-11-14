"use client";

import { useRef, useState, type FormEvent } from "react";
import { type WeddingSide } from "@/config/wedding";
import { useWedding, useWeddingPreview } from "./wedding-content";
import Modal from "./modal";
import Icon from "./icon";

export default function RsvpDialog({ side, onClose }: { side: WeddingSide; onClose: () => void }) {
  const wedding = useWedding();
  const preview = useWeddingPreview();
  const copy = wedding.content.rsvp;
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [attending, setAttending] = useState("yes");
  const [busy, setBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [temporaryStorage, setTemporaryStorage] = useState(false);
  const pending = useRef<{ id: string; payload: string } | null>(null);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) { setError(copy.nameError); return; }
    const email = attending === "yes" ? String(data.get("email") ?? "").trim() : "";
    if (email && !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)) { setError(copy.emailError); return; }
    if (preview) { setEmailStatus("preview"); setSaved(true); return; }
    const payload = { name, email, attending, guests: attending === "yes" ? Number(data.get("guests")) : 0, message: String(data.get("message") ?? "").trim(), side, website: String(data.get("website") ?? "") };
    const serialized = JSON.stringify(payload);
    if (pending.current?.payload !== serialized) pending.current = { id: crypto.randomUUID(), payload: serialized };
    submitting.current = true; setBusy(true); setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, submissionId: pending.current.id }), signal: controller.signal });
      const result = await response.json();
      if (!response.ok || !result.received) throw new Error("submit");
      setEmailStatus(result.emailStatus); setTemporaryStorage(result.storage === "temporary"); setSaved(true);
    } catch { setError(copy.submitError); }
    finally { window.clearTimeout(timeout); submitting.current = false; setBusy(false); }
  }

  return (
    <Modal onClose={() => { if (!submitting.current) onClose(); }} label={copy.label} className="rsvp-modal-compact">
      {saved ? (
        <div className="rsvp-success">
          <span className="success-icon"><Icon name="check" size={28} /></span>
          <span className="eyebrow">{copy.thanks}</span>
          <h2>{attending === "no" ? copy.declinedTitle : copy.successTitle}</h2>
          <p>{attending === "no" ? copy.declinedMessage : copy.successMessage}</p>
          {emailStatus === "preview" && <p className="rsvp-mail-status" role="status">{copy.previewMessage}</p>}
          {emailStatus === "sent" && <p className="rsvp-mail-status" role="status">{copy.emailSent}</p>}
          {["failed", "unconfigured", "disabled", "rate-limited"].includes(emailStatus) && <p className="rsvp-mail-status" role="status">{copy.emailUnavailable}</p>}
          {emailStatus === "pending" && <p className="rsvp-mail-status" role="status">{copy.emailPending}</p>}
          {temporaryStorage && <p className="rsvp-mail-status" role="status">{copy.temporaryNotice}</p>}
          <button className="button button-red" onClick={onClose}>{copy.back} <Icon name="heart" size={17} /></button>
        </div>
      ) : (
        <div className="rsvp-compact-wrap">
          <div className="rsvp-dialog-header">
            <span className="eyebrow">{copy.eyebrow}</span>
            <h2>{copy.title}</h2>
            <p className="form-intro">{copy.invitation} {wedding.events[side].sideLabel.toLocaleLowerCase("vi-VN")} · {wedding.events[side].label}</p>
          </div>
          <form onSubmit={event => void submit(event)} aria-busy={busy} className="rsvp-form">
            <fieldset className="rsvp-fields" disabled={busy}>
              <div className="rsvp-form-row">
                <label htmlFor="guest-name">{copy.name} <span aria-hidden="true">*</span></label>
                <input id="guest-name" name="name" autoComplete="name" placeholder={copy.namePlaceholder} required maxLength={100} />
              </div>

              <fieldset className="rsvp-attendance">
                  <legend>{copy.attendance}</legend>
                  <div className="rsvp-radio-group">
                    <label className="radio-option">
                      <input type="radio" name="attending" value="yes" checked={attending === "yes"} onChange={() => setAttending("yes")} />
                      <span>{copy.yes}</span>
                    </label>
                    <label className="radio-option">
                      <input type="radio" name="attending" value="no" checked={attending === "no"} onChange={() => setAttending("no")} />
                      <span>{copy.no}</span>
                    </label>
                  </div>
              </fieldset>

              <div className="rsvp-form-grid">
                  <div className="rsvp-form-col">
                    <label htmlFor="guest-count">{copy.guests}</label>
                    <select id="guest-count" name="guests" defaultValue="1" disabled={attending !== "yes"}>
                      {Array.from({ length: 10 }, (_, index) => (
                        <option key={index} value={index + 1}>{index + 1} {copy.guestUnit}</option>
                      ))}
                    </select>
                  </div>
                <div className="rsvp-form-col">
                  <label htmlFor="guest-email">{copy.email}</label>
                  <input id="guest-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder={copy.emailPlaceholder} maxLength={254} disabled={attending !== "yes"} />
                </div>
              </div>

              <div className="rsvp-form-row">
                <label htmlFor="guest-message">{copy.message}</label>
                <textarea id="guest-message" name="message" rows={2} maxLength={1000} placeholder={copy.messagePlaceholder} />
              </div>

              <div className="rsvp-trap" aria-hidden="true">
                <label htmlFor="guest-website">Website</label>
                <input id="guest-website" name="website" tabIndex={-1} autoComplete="off" />
              </div>
            </fieldset>

            {error && <p role="alert" className="form-error">{error}</p>}
            <button type="submit" className="button button-red rsvp-submit-btn" disabled={busy}>
              {busy ? copy.submitting : copy.submit} <Icon name="arrow" size={17} />
            </button>
          </form>
        </div>
      )}
    </Modal>
  );
}
