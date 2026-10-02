import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

/**
 * Landing — classical DaisyUI hero (template: navbar elsewhere, hero + CTA).
 * First viewport: brand, one headline, one sentence, one CTA.
 */
export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden">
      <section className="hero min-h-[calc(100dvh-5.5rem)]">
        <div className="hero-content page-shell page-shell-wide w-full flex-col items-stretch gap-8 py-[max(1.5rem,var(--safe-top))] pb-[max(1.5rem,var(--safe-bottom))] lg:flex-row lg:items-center lg:gap-12 lg:py-12">
          <div className="flex w-full items-center justify-between gap-3 lg:absolute lg:left-0 lg:right-0 lg:top-[max(1rem,var(--safe-top))] lg:mx-auto lg:max-w-[var(--page-max-wide)] lg:px-4">
            <Chip>Coaching · Orientierung</Chip>
            <Chip href="/profile">Profile</Chip>
          </div>

          <div className="stack-sm relative z-10 max-w-xl flex-1 text-center lg:pt-10 lg:text-left">
            <p
              className="animate-rise brand-mark text-base-content"
              style={{ animationDelay: "40ms", fontSize: "var(--text-hero)" }}
            >
              Skill<span className="brand-accent">ster</span>
            </p>
            <h1
              className="animate-rise max-w-md text-xl font-medium leading-snug tracking-tight text-base-content/75 sm:text-2xl md:text-[1.65rem]"
              style={{ animationDelay: "120ms" }}
            >
              Dein Arbeitsmuster — in Bildern.
            </h1>
            <p
              className="animate-rise max-w-sm text-[0.95rem] leading-relaxed text-base-content/60 md:text-base"
              style={{ animationDelay: "180ms" }}
            >
              Tippen. Erkennen. Klarheit für den Berufsweg.
            </p>
            <div
              className="animate-rise mx-auto flex w-full max-w-md flex-col gap-3 pt-4 lg:mx-0 lg:max-w-sm"
              style={{ animationDelay: "240ms" }}
            >
              <Button href="/assessment" variant="primary" size="lg" className="w-full">
                Zu den Aufgaben
              </Button>
              <p className="meta-label text-center normal-case tracking-[0.04em] lg:text-left">
                Privat · mobil · Zwischenspeicher
              </p>
            </div>
          </div>

          <div
            className="animate-rise relative mx-auto hidden aspect-[5/4] w-full max-w-lg flex-1 lg:block"
            style={{ animationDelay: "100ms" }}
            aria-hidden
          >
            <div className="card bg-base-100 absolute inset-[8%] rotate-[-3deg] scale-[0.98] border border-base-300 opacity-50 shadow-sm" />
            <div className="card bg-base-100 absolute inset-0 overflow-hidden border border-base-300 shadow-md">
              <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-primary/15 blur-2xl" />
              <div className="absolute bottom-4 right-4 h-48 w-48 rounded-full bg-accent/10 blur-2xl" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-28 w-28 rounded-full border border-base-300 bg-base-200 md:h-36 md:w-36" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell page-shell-wide pb-12 pt-2">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Bildaufgaben",
              body: "Zwei Wege tippen — ohne Fragebogen-Jargon.",
            },
            {
              title: "Lokaler Speicher",
              body: "Antworten bleiben im Browser — kein Cloud-Zwang.",
            },
            {
              title: "Orientierung",
              body: "HOW & WHAT fürs Coaching — keine Diagnose.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="card bg-base-100 border border-base-300 p-5 shadow-sm"
            >
              <h2 className="display-title text-lg text-base-content">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-base-content/60">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
