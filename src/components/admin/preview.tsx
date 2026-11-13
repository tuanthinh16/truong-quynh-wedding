"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import WeddingEntrance from "@/components/wedding-entrance";
import WeddingInvitation from "@/components/wedding-invitation";
import { WeddingAudioProvider } from "@/components/wedding-audio";
import { WeddingContentProvider } from "@/components/wedding-content";
import { editorDocuments } from "@/lib/editor-schema.mjs";
import type { EditorDocument, EditorPath, WeddingData } from "@/lib/editor-types";

export interface PreviewMessage { data: WeddingData; page: "entrance" | "groom" | "bride"; mode: "select" | "browse"; selected: EditorPath | null }

class PreviewBoundary extends Component<{ children: ReactNode; data: WeddingData }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previous: { data: WeddingData }) {
    if (this.state.failed && previous.data !== this.props.data) this.setState({ failed: false });
  }
  render() { return this.state.failed ? <p role="alert">Bản nháp chưa hợp lệ. Kiểm tra lại nội dung trong bảng chỉnh sửa.</p> : this.props.children; }
}

function PreviewSurface({ state }: { state: PreviewMessage }) {
  const surface = useRef<HTMLDivElement>(null);
  const fields = useMemo(() => {
    const documents = editorDocuments(state.data) as EditorDocument[];
    const preferred = [state.page, `event-${state.page}`, `content-${state.page === "entrance" ? "entrance" : "invitation"}`];
    return documents.sort((first, second) => Number(preferred.includes(second.id)) - Number(preferred.includes(first.id))).flatMap(doc => doc.fields);
  }, [state.data, state.page]);

  useEffect(() => {
    const root = surface.current;
    if (!root) return;
    const fieldMap = new Map(fields.map(field => [JSON.stringify(field.path), field]));
    const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
    function bind() {
      if (!root) return;
      root.querySelectorAll<HTMLElement>("[data-editor-ref]").forEach(element => { delete element.dataset.editorRef; delete element.dataset.editorSelected; element.removeAttribute("title"); });
      function mark(element: HTMLElement, key: string) {
        const field = fieldMap.get(key);
        if (!field) return;
        element.dataset.editorRef = key;
        element.dataset.editorSelected = String(key === JSON.stringify(state.selected));
        if (state.mode === "select") element.title = `Sửa: ${field.label}`;
      }
      root.querySelectorAll<HTMLElement>("[data-edit]").forEach(element => mark(element, element.dataset.edit || ""));
      root.querySelectorAll<HTMLElement>("img, p, span, h1, h2, h3, em, strong, button, a, label, small, blockquote").forEach(element => {
        if (element.closest("[data-edit]") || element.querySelector("[data-edit]")) return;
        if (element instanceof HTMLImageElement) {
          const url = new URL(element.currentSrc || element.src, location.origin);
          const src = url.searchParams.get("url") || url.pathname;
          const field = fields.find(field => field.kind === "image" && field.value === src);
          if (field) mark(element, JSON.stringify(field.path));
        } else {
          const direct = Array.from(element.childNodes).filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent || "").join(" ");
          const text = normalize(direct || (element.children.length ? "" : element.textContent || ""));
          const field = text && fields.find(field => field.kind === "text" && typeof field.value === "string" && normalize(field.value) === text);
          if (field) mark(element, JSON.stringify(field.path));
        }
      });
    }
    bind();
    const observer = new MutationObserver(bind);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    function click(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const editable = target?.closest<HTMLElement>("[data-editor-ref]");
      if (state.mode === "select") {
        event.preventDefault(); event.stopImmediatePropagation();
        const path = editable?.dataset.editorRef ? JSON.parse(editable.dataset.editorRef) : target?.closest(".hero-paper") ? ["photos", "hero"] : target?.closest(".welcome-screen") ? ["photos", "roses"] : null;
        if (path) window.parent.postMessage({ type: "wedding:select", path }, location.origin);
      } else {
        const anchor = target?.closest<HTMLAnchorElement>("a[href]");
        if (!anchor) return;
        const url = new URL(anchor.href, location.href);
        if (url.origin === location.origin && ["/", "/nha-trai", "/nha-gai"].includes(url.pathname) && !url.hash) {
          event.preventDefault(); event.stopImmediatePropagation();
          window.parent.postMessage({ type: "wedding:navigate", page: url.pathname === "/" ? "entrance" : url.pathname === "/nha-trai" ? "groom" : "bride" }, location.origin);
        } else if (url.origin !== location.origin) { event.preventDefault(); event.stopImmediatePropagation(); }
      }
    }
    root.addEventListener("click", click, true);
    return () => { observer.disconnect(); root.removeEventListener("click", click, true); };
  }, [fields, state.mode, state.selected]);

  return <div ref={surface} className={`editor-preview ${state.mode === "select" ? "editor-selecting" : ""}`}>
    <WeddingContentProvider value={state.data}><WeddingAudioProvider>
      {state.page === "entrance" ? <WeddingEntrance /> : <WeddingInvitation side={state.page} />}
    </WeddingAudioProvider></WeddingContentProvider>
  </div>;
}

export function WeddingPreview() {
  const [state, setState] = useState<PreviewMessage | null>(null);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== "wedding:render") return;
      const payload = event.data.state as PreviewMessage;
      if (!payload?.data || !["entrance", "groom", "bride"].includes(payload.page) || !["select", "browse"].includes(payload.mode)) return;
      setState(payload);
    }
    window.addEventListener("message", receive);
    function keyboard(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault(); window.parent.postMessage({ type: "wedding:save" }, location.origin);
      }
    }
    window.addEventListener("keydown", keyboard);
    window.parent.postMessage({ type: "wedding:ready" }, location.origin);
    return () => { window.removeEventListener("message", receive); window.removeEventListener("keydown", keyboard); };
  }, []);
  return state ? <PreviewBoundary data={state.data}><PreviewSurface state={state} /></PreviewBoundary> : <p className="ed-preview-hint">Đang mở bản xem trước…</p>;
}
