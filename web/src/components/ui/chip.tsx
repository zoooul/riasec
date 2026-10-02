"use client";

import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChipProps = {
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  href?: string;
  /** @deprecated Prefer href/onClick */
  asChild?: boolean;
  "aria-live"?: "off" | "polite" | "assertive";
};

/** Soft DaisyUI badge / status chip. */
export function Chip({
  className,
  children,
  asChild,
  onClick,
  href,
  ...props
}: ChipProps): ReactElement {
  void asChild;
  const classes = cn("badge badge-soft badge-primary gap-1.5", className);

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} {...props}>
        {children}
      </button>
    );
  }

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
