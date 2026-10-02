"use client";

import type { ReactNode } from "react";
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

/** DaisyUI modal dialog — controlled open state. */
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
  return (
    <dialog
      className={`modal ${open ? "modal-open" : ""} ${className}`}
      open={open || undefined}
      aria-labelledby="confirm-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-box">
        <h3 id="confirm-dialog-title" className="display-title text-xl">
          {title}
        </h3>
        <div className="py-3 text-sm text-base-content/70">{children}</div>
        <div className="modal-action">
          {confirmHref ? (
            <Button href={confirmHref} variant="secondary" size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
