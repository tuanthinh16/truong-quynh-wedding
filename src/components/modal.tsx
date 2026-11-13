"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useWedding } from "./wedding-content";
import Icon from "./icon";

export default function Modal({ children, onClose, label, className = "" }: { children: ReactNode; onClose: () => void; label: string; className?: string }) {
  const wedding = useWedding();
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal(); document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return <dialog ref={dialogRef} aria-label={label} className={`modal ${className}`} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
    if (event.target === event.currentTarget) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }
  }}><button className="modal-close" onClick={onClose} aria-label={wedding.content.modal.close}><Icon name="close" /></button>{children}</dialog>;
}
