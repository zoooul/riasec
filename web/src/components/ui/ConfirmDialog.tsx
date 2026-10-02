"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmHref?: string;
  className?: string;
};

/** DaisyUI modal dialog — controlled open state + corner close (docs pattern). */
export function ConfirmDialog({
  open,
  title,
  children,
  onClose,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  onConfirm,
  confirmHref,
  className = "",
}: Props) {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const node = confirmRef.current;
    if (node && "focus" in node) {
      window.requestAnimationFrame(() => node.focus());
    }
  }, [open]);

  return (
    <dialog
      className={`modal z-[var(--z-modal)] ${open ? "modal-open" : ""} ${className}`}
      open={open || undefined}
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-box relative">
        <form method="dialog">
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            aria-label="Schließen"
            onClick={onClose}
          >
            ✕
          </button>
        </form>
        <h3 id={titleId} className="display-title pr-8 text-xl">
          {title}
        </h3>
        <div className="py-3 text-sm text-base-content/70">{children}</div>
        <div className="modal-action">
          {confirmHref ? (
            <Button
              href={confirmHref}
              variant="secondary"
              size="sm"
              onClick={onConfirm}
              ref={confirmRef}
            >
              {confirmLabel}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onConfirm}
              ref={confirmRef}
            >
              {confirmLabel}
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose} aria-label="Schließen">
          Schließen
        </button>
      </form>
    </dialog>
  );
}
