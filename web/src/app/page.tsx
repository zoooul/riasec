import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

/**
 * Landing — classical DaisyUI hero.
 * First viewport: brand, one headline, one sentence, one CTA (+ optional media plane).
 * Feature cards sit clearly below the fold.
 */
export default function HomePage() {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
      <SiteHeader
        right={
          <Chip href="/profile" className="badge-ghost">
            Profile
          </Chip>
        }
      />

      <section className="hero min-h-0 flex-1">
        <div className="hero-content page-shell page-shell-wide w-full flex-col items-stretch gap-8 py-10 pb-8 lg:grid lg:min-h-[calc(100dvh-var(--header-h)-7rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12 lg:py-14">
          <div className="stack max-w-xl min-w-0 text-center lg:text-left">
            <Chip className="mx-auto w-fit lg:mx-0">Coaching · Orientierung</Chip>
            <p
              className="animate-rise brand-mark text-base-content"
              style={{ animationDelay: "40ms", fontSize: "var(--text-hero)" }}
            >
              Skill<span className="brand-accent">ster</span>
            </p>
            <h1
              className="animate-rise max-w-md text-[1.35rem] font-medium leading-snug tracking-tight text-base-content/75 sm:text-2xl md:text-[1.7rem]"
              style={{ animationDelay: "120ms" }}
            >
              Dein Arbeitsmuster — in Bildern.
            </h1>
            <p
              className="animate-rise max-w-sm text-base leading-relaxed text-base-content/58"
              style={{ animationDelay: "180ms" }}
            >
              Tippen. Erkennen. Klarheit für den Berufsweg.
            </p>
            <div
              className="animate-rise mx-auto flex w-full max-w-sm flex-col gap-2 pt-2 lg:mx-0"
              style={{ animationDelay: "240ms" }}
            >
              <Button
                href="/assessment"
                variant="primary"
                size="lg"
                className="w-full"
              >
                Zu den Aufgaben
              </Button>
              <p className="meta-label text-center normal-case tracking-[0.04em] text-base-content/45 lg:text-left">
                Privat · mobil · Zwischenspeicher · Taste 1 · 2
              </p>
            </div>
          </div>

          <div
            className="animate-rise mx-auto hidden w-full max-w-md min-w-0 lg:block"
            style={{ animationDelay: "100ms" }}
            aria-hidden
          >
            <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-md">
              <figure className="landing-hero-figure aspect-[5/4] bg-gradient-to-br from-primary/12 via-base-100 to-secondary/10">
                <div className="grid h-full w-full place-items-center p-8">
                  <div className="grid w-full max-w-[14rem] grid-cols-2 gap-3">
                    <div className="aspect-[5/3] rounded-box border border-base-300 bg-base-200/80" />
                    <div className="aspect-[5/3] rounded-box border border-primary/25 bg-primary/10" />
                    <div className="col-span-2 h-2 rounded-full bg-base-300">
                      <div className="h-full w-2/5 rounded-full bg-primary/70" />
                    </div>
                  </div>
                </div>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-base-300 bg-base-100">
        <div className="page-shell page-shell-wide py-12 md:py-16">
          <div className="mb-8 max-w-xl text-center md:text-left">
            <h2 className="display-title text-2xl text-base-content md:text-3xl">
              So funktioniert’s
            </h2>
            <p className="mt-2 text-base text-base-content/58">
              Kurze Bildaufgaben statt Fragebogen — lokal im Browser.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                title: "Bildaufgaben",
                body: "Zwei Wege tippen oder Taste 1 · 2 — ohne Jargon.",
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
                className="card border border-base-300 bg-base-100 shadow-sm"
              >
                <div className="card-body gap-2 p-6">
                  <h3 className="display-title text-lg text-base-content">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-base-content/60">
                    {card.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
