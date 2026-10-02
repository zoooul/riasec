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

export function SiteHeader({ right, sticky = true, className }: Props) {
  return (
    <header
      className={cn(
        "site-header z-20 shrink-0 border-b border-base-300 bg-base-100/90 backdrop-blur-md",
        sticky ? "sticky top-0" : "relative",
        className,
      )}
    >
      <div className="site-header-inner navbar mx-auto w-full max-w-5xl px-3 sm:px-4">
        <div className="navbar-start">
          <Link
            href="/"
            className="brand-mark text-base text-base-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-lg md:text-xl"
          >
            Skill<span className="brand-accent">ster</span>
          </Link>
        </div>
        <div className="navbar-end gap-2">
          {right ?? <Chip>privat · lokal</Chip>}
        </div>
      </div>
    </header>
  );
}
