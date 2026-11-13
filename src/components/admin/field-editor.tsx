"use client";

/* eslint-disable @next/next/no-img-element */
import { useId } from "react";
import type { EditorField, FieldValue } from "@/lib/editor-types";
import { imageSettings } from "@/lib/image-settings.mjs";

export function FieldEditor({ field, disabled, change, upload, library, maxUploadBytes = imageSettings.maxUploadBytes }: {
  field: EditorField; disabled: boolean; change: (value: FieldValue) => void;
  upload: (file: File) => void; library: () => void; maxUploadBytes?: number;
}) {
  const id = useId();
  const value = field.value ?? "";
  const dateValue = field.kind === "date" && typeof value === "string" && value && Number.isFinite(Date.parse(value)) ? new Date(Date.parse(value) + 7 * 60 * 60 * 1000).toISOString().slice(0, 16) : "";
  return <section className="ed-field">
    <label htmlFor={id}>{field.label}</label>
    {field.kind === "image" ? <div className="ed-image-field">
      {value && <img src={String(value)} alt="Ảnh đang chọn" />}
      <input id={id} value={String(value)} disabled={disabled} onChange={event => change(event.target.value)} aria-label={`${field.label} — đường dẫn trong public`} />
      <div className="ed-image-actions"><label className="ed-upload">Upload ảnh<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={disabled} onChange={event => { const file = event.target.files?.[0]; if (file) upload(file); event.target.value = ""; }} /></label><button type="button" disabled={disabled} onClick={library}>Thư viện ảnh</button></div>
      <small>Upload local: JPG, PNG, WebP, AVIF · tối đa {maxUploadBytes / 1024 / 1024} MB, {imageSettings.maxInputPixels / 1000000} MP. Server tự xoay và thu ảnh về tối đa {imageSettings.maxUploadDimension}px, lưu WebP; QR giữ lossless. Ảnh lưu vào public/uploads/editor. Lưu nội dung rồi commit/push cả ảnh để cập nhật bản online.</small>
    </div> : field.kind === "toggle" ? <div className="ed-toggle"><input id={id} type="checkbox" checked={Boolean(value)} disabled={disabled} onChange={event => change(event.target.checked)} /><span>{value ? "Bật" : "Tắt"}</span></div>
      : field.kind === "icon" ? <select id={id} value={String(value)} disabled={disabled} onChange={event => change(event.target.value)}>{["heart", "arrow", "pin", "calendar", "check", "close", "chevron", "copy", "car", "flower", "rings", "image", "music", "play", "pause", "scroll"].map(icon => <option key={icon}>{icon}</option>)}</select>
      : field.kind === "number" ? <input id={id} type="number" min={0} step="any" value={String(value)} disabled={disabled} onChange={event => { if (event.target.value !== "") change(Number(event.target.value)); }} />
      : field.kind === "date" ? <><input id={id} type="datetime-local" value={dateValue} disabled={disabled} onChange={event => change(event.target.value ? `${event.target.value.slice(0, 16)}:00+07:00` : null)} /><small>Giờ Việt Nam (UTC+7). Để trống nếu chưa xác định.</small></>
      : field.kind === "day" ? <input id={id} type="date" value={String(value)} disabled={disabled} onChange={event => change(event.target.value)} />
      : field.kind === "url" ? <><input id={id} type="url" value={String(value)} disabled={disabled} onChange={event => {
        const input = field.key === "mapEmbedUrl" && event.target.value.trim().startsWith("<") ? new DOMParser().parseFromString(event.target.value, "text/html").querySelector("iframe")?.getAttribute("src") || event.target.value : event.target.value;
        change(input || (field.nullable ? null : ""));
      }} />{field.key === "mapEmbedUrl" && <small>Google Maps → Chia sẻ → Nhúng bản đồ → Sao chép HTML. Dán toàn bộ iframe hoặc chỉ link src; không dùng link maps.app.goo.gl. Bản đồ không tự đổi theo địa chỉ. Để trống để ẩn map.</small>}</>
      : <textarea id={id} rows={String(value).length > 120 ? 4 : 2} value={String(value)} maxLength={10000} disabled={disabled} onChange={event => change(event.target.value)} />}
    <code>{field.path.join(".")}</code>
  </section>;
}
