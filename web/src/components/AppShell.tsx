import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Classical DaisyUI shell adapted from free landing templates
 * (navbar in SiteHeader, footer here, hero/cards in pages).
 */
export function AppShell({ children, className = "" }: Props) {
  return (
    <div className={`app-stage ${className}`}>
      <div className="content-layer flex min-h-dvh flex-col">{children}</div>
      <footer className="app-footer footer footer-horizontal footer-center border-t border-base-300 bg-base-100 text-base-content/70 no-print">
        <aside className="page-shell page-shell-wide flex w-full flex-col items-center gap-3 py-6 sm:flex-row sm:justify-between">
          <p className="brand-mark text-sm text-base-content">
            Skill<span className="brand-accent">ster</span>
            <span className="ml-2 font-sans text-xs font-normal text-base-content/55">
              privat · lokal · Orientierung
            </span>
          </p>
          <nav className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/assessment" className="link link-hover">
              Aufgaben
            </Link>
            <Link href="/ergebnis" className="link link-hover">
              Ergebnis
            </Link>
            <Link href="/profile" className="link link-hover">
              Profile
            </Link>
          </nav>
        </aside>
      </footer>
    </div>
  );
}
