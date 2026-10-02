import Link from "next/link";
import type { ReactNode } from "react";
import { Chip } from "@/components/ui/chip";

type Props = {
  right?: ReactNode;
};

export function SiteHeader({ right }: Props) {
  return (
    <header
      className="sticky top-0 z-20 px-4 pt-[max(0.75rem,var(--safe-top))] backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(7,16,31,0.72), rgba(7,16,31,0.2))",
      }}
    >
      <div className="glass-panel glass-panel-strong mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-2.5">
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
