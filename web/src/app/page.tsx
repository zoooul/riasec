import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden">
      <section className="page-shell page-shell-wide relative mx-auto flex w-full flex-1 flex-col justify-between gap-6 pb-[max(1.25rem,var(--safe-bottom))] pt-[max(1rem,var(--safe-top))] md:gap-8 md:py-8 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-10 lg:py-10">
        <div className="flex items-center justify-between gap-3 lg:col-span-2">
          <Chip>Coaching · Orientierung</Chip>
          <Chip asChild className="text-[var(--muted-strong)]">
            <Link href="/profile">Profile</Link>
          </Chip>
        </div>

        <div className="relative my-auto flex min-h-0 flex-1 flex-col items-center justify-center text-center lg:items-start lg:text-left">
          {/* Mobile / tablet atmosphere — kept behind brand */}
          <div
            className="animate-rise pointer-events-none absolute inset-x-0 top-[44%] mx-auto h-[48vw] max-h-[300px] w-[88%] max-w-[520px] -translate-y-1/2 opacity-70 lg:hidden"
            aria-hidden
          >
            <div className="glass-panel absolute inset-0 rotate-[-2.5deg] scale-[0.96] opacity-30" />
            <div className="glass-panel glass-panel-strong absolute inset-0 overflow-hidden">
              <div className="absolute -left-6 top-6 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(94,200,214,0.28),transparent_70%)] blur-2xl" />
              <div className="absolute bottom-1 right-1 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(216,137,154,0.18),transparent_70%)] blur-2xl" />
            </div>
          </div>

          <div className="relative z-10 stack-sm max-w-xl px-1">
            <p
              className="animate-rise display-title text-[var(--ink)]"
              style={{ animationDelay: "40ms", fontSize: "var(--text-hero)" }}
            >
              Skill<span className="neon-text">ster</span>
            </p>
            <h1
              className="animate-rise max-w-md text-xl font-medium leading-snug tracking-tight text-[var(--muted-strong)] sm:text-2xl md:text-[1.65rem]"
              style={{ animationDelay: "120ms" }}
            >
              Dein Arbeitsmuster — in Bildern.
            </h1>
            <p
              className="animate-rise max-w-sm text-[0.95rem] leading-relaxed text-[var(--muted)] md:text-base"
              style={{ animationDelay: "180ms" }}
            >
              Tippen. Erkennen. Klarheit für den Berufsweg.
            </p>
          </div>
        </div>

        {/* Desktop visual plane — uses width instead of stacking height */}
        <div
          className="animate-rise relative mx-auto hidden aspect-[5/4] w-full max-w-lg lg:block"
          style={{ animationDelay: "100ms" }}
          aria-hidden
        >
          <div className="glass-panel absolute inset-[8%] rotate-[-3deg] scale-[0.98] opacity-40" />
          <div className="glass-panel glass-panel-strong glass-sheen absolute inset-0 overflow-hidden">
            <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(94,200,214,0.3),transparent_70%)] blur-2xl" />
            <div className="absolute bottom-4 right-4 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(216,137,154,0.2),transparent_70%)] blur-2xl" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-28 w-28 rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-md md:h-36 md:w-36" />
            </div>
          </div>
        </div>

        <div
          className="animate-rise relative z-10 mx-auto flex w-full max-w-md flex-col gap-3 pb-1 lg:col-span-2 lg:mx-0 lg:max-w-sm"
          style={{ animationDelay: "240ms" }}
        >
          <Button asChild variant="primary" size="lg" className="w-full">
            <Link href="/assessment">Jetzt starten</Link>
          </Button>
          <p className="meta-label text-center normal-case tracking-[0.04em] lg:text-left">
            Privat · mobil · Zwischenspeicher
          </p>
        </div>
      </section>
    </main>
  );
}
