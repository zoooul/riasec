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
        "site-header z-20 shrink-0 px-3 pt-[max(0.35rem,var(--safe-top))] backdrop-blur-xl sm:px-4",
        sticky ? "sticky top-0" : "relative",
        className,
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(7,16,31,0.78), rgba(7,16,31,0.18))",
      }}
    >
      <div className="site-header-inner glass-panel glass-panel-strong mx-auto flex w-full max-w-5xl items-center justify-between px-3 py-[clamp(0.35rem,0.9vh,0.55rem)] sm:px-4">
        <Link
          href="/"
          className="display-title text-lg text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--neon-cyan)] sm:text-xl md:text-2xl"
        >
          Skill<span className="neon-text">ster</span>
        </Link>
        {right ?? <Chip>privat · lokal</Chip>}
      </div>
    </header>
  );
}
