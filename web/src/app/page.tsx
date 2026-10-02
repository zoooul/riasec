import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

/**
 * Landing — classical DaisyUI hero (template: navbar elsewhere, hero + CTA).
 * First viewport: brand, one headline, one sentence, one CTA.
 * Media sits in its own grid plane (never stacked over brand/copy).
 */
export default function HomePage() {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
      <SiteHeader />
      <section className="hero min-h-0 flex-1 lg:min-h-[calc(100dvh-var(--header-h)-8rem)]">
        <div className="hero-content page-shell page-shell-wide w-full flex-col items-stretch gap-6 py-8 pb-[max(1.25rem,var(--safe-bottom))] pt-[max(1rem,var(--safe-top))] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-10 lg:py-12">
          <div className="flex w-full items-center justify-between gap-3 lg:col-span-2">
            <Chip>Coaching · Orientierung</Chip>
            <Chip href="/profile">Profile</Chip>
          </div>

          <div className="stack-sm max-w-xl min-w-0 text-center lg:text-left">
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
              className="animate-rise mx-auto flex w-full max-w-md flex-col gap-2.5 pt-4 lg:mx-0 lg:max-w-sm"
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
            className="animate-rise mx-auto hidden w-full max-w-lg min-w-0 lg:block"
            style={{ animationDelay: "100ms" }}
            aria-hidden
          >
            <div className="card bg-base-100 border border-base-300 shadow-md">
              <figure className="landing-hero-figure aspect-[5/4] bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10">
                <div className="grid h-full w-full place-items-center">
                  <div className="h-28 w-28 rounded-full border border-base-300 bg-base-100 md:h-36 md:w-36" />
                </div>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell page-shell-wide pb-10 pt-2">
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
              className="card bg-base-100 border border-base-300 shadow-sm"
            >
              <div className="card-body gap-2 p-5">
                <h2 className="display-title text-lg text-base-content">
                  {card.title}
                </h2>
                <p className="text-sm leading-relaxed text-base-content/60">
                  {card.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
