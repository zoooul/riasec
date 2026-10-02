import Link from "next/link";
import type { ReactNode } from "react";

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
      <div className="glass-panel glass-panel-strong mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--ink)] md:text-xl"
        >
          Skill<span className="neon-text">ster</span>
        </Link>
        {right ?? (
          <span className="glass-chip text-[var(--neon-cyan)]">privat · lokal</span>
        )}
      </div>
    </header>
  );
}
