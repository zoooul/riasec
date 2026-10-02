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
        "z-20 shrink-0 px-4 pt-[max(0.5rem,var(--safe-top))] backdrop-blur-xl",
        sticky ? "sticky top-0" : "relative",
        className,
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(7,16,31,0.72), rgba(7,16,31,0.2))",
      }}
    >
      <div className="glass-panel glass-panel-strong mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-[clamp(0.4rem,1vh,0.65rem)]">
        <Link
          href="/"
          className="display-title text-xl text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--neon-cyan)] md:text-2xl"
        >
          Skill<span className="neon-text">ster</span>
        </Link>
        {right ?? <Chip>privat · lokal</Chip>}
      </div>
    </header>
  );
}
