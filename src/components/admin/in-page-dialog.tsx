"use client";

import { useEffect, useRef } from "react";

const dialogs: HTMLElement[] = [];
let previousOverflow = "";

export function InPageDialog({ children, className, label, labelledBy, inactive = false, onClose }: {
  children: React.ReactNode; className: string; label?: string; labelledBy?: string; inactive?: boolean; onClose: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialogs.length) { previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
    dialogs.push(element);
    const focusable = () => Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([type="hidden"]),textarea:not(:disabled),select:not(:disabled),a[href],[contenteditable="true"],[tabindex="0"]')).filter(target => target.getClientRects().length && !target.closest("[inert]"));
    (focusable()[0] || element).focus();
    function keyboard(event: KeyboardEvent) {
      if (dialogs.at(-1) !== element) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key === "Tab") {
        const targets = focusable();
        const first = targets[0], last = targets.at(-1);
        if (!first) { event.preventDefault(); element?.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !element?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !element?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("keydown", keyboard, true);
      const index = dialogs.indexOf(element);
      if (index !== -1) dialogs.splice(index, 1);
      if (!dialogs.length) document.body.style.overflow = previousOverflow;
      queueMicrotask(() => {
        const parent = dialogs.at(-1);
        if (parent?.isConnected) (previousFocus?.isConnected && parent.contains(previousFocus) ? previousFocus : parent).focus();
        else if (!dialogs.length && previousFocus?.isConnected) previousFocus.focus();
      });
    };
  }, []);
  return <div className="ed-overlay" inert={inactive || undefined} aria-hidden={inactive || undefined} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={container} className={className} role="dialog" aria-modal={!inactive} aria-label={label} aria-labelledby={labelledBy} tabIndex={-1}>{children}</div>
  </div>;
}
