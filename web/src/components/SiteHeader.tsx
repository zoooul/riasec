import Link from "next/link";
import type { ReactNode } from "react";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";

type Props = {
  right?: ReactNode;
  /** Sticky chrome (default). Assessment viewport uses false to avoid double scroll. */
  sticky?: boolean;
  className?: string;
};

/** Classical DaisyUI navbar — `bg-base-100 shadow-sm`, navbar-start/end. */
export function SiteHeader({ right, sticky = true, className }: Props) {
  return (
    <header
      className={cn(
        "site-header z-20 shrink-0 border-b border-base-300/80 bg-base-100/95 backdrop-blur-sm",
        sticky ? "sticky top-0" : "relative",
        className,
      )}
    >
      <div className="site-header-inner navbar page-shell page-shell-wide">
        <div className="navbar-start min-h-0">
          <Link
            href="/"
            className="btn btn-ghost brand-mark px-2 text-base text-base-content sm:text-lg md:text-xl"
          >
            Skill<span className="brand-accent">ster</span>
          </Link>
        </div>
        <div className="navbar-end min-h-0 gap-2">
          {right ?? (
            <Chip className="badge-ghost badge-sm">privat · lokal</Chip>
          )}
        </div>
      </div>
    </header>
  );
}
