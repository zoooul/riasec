import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

/**
 * Landing — classical DaisyUI hero (Context7 / daisyui.com hero + card patterns).
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

      <section className="hero min-h-0 flex-1 bg-transparent">
        <div className="hero-content page-shell page-shell-wide w-full flex-col items-stretch gap-10 py-12 pb-10 lg:grid lg:min-h-[calc(100dvh-var(--header-h)-6rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:items-center lg:gap-16 lg:py-16 xl:gap-24">
          <div className="stack min-w-0 text-center lg:max-w-3xl lg:text-left">
            <Chip className="mx-auto w-fit lg:mx-0">Coaching · Orientierung</Chip>
            <p
              className="animate-rise brand-mark text-base-content"
              style={{ animationDelay: "40ms", fontSize: "var(--text-hero)" }}
            >
              Skill<span className="brand-accent">ster</span>
            </p>
            <h1
              className="animate-rise max-w-2xl text-2xl font-medium leading-snug tracking-tight text-base-content/75 sm:text-3xl lg:text-4xl xl:text-5xl"
              style={{ animationDelay: "120ms" }}
            >
              Dein Arbeitsmuster — in Bildern.
            </h1>
            <p
              className="animate-rise max-w-xl text-base leading-relaxed text-base-content/58 sm:text-lg"
              style={{ animationDelay: "180ms" }}
            >
              Tippen. Erkennen. Klarheit für den Berufsweg.
            </p>
            <div
              className="animate-rise mx-auto flex w-full max-w-md flex-col gap-2 pt-2 lg:mx-0"
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
              <p className="meta-label flex flex-wrap items-center justify-center gap-1.5 normal-case tracking-[0.04em] text-base-content/45 lg:justify-start">
                <span>Privat · mobil · Zwischenspeicher</span>
                <span className="inline-flex items-center gap-0.5" aria-hidden>
                  <kbd className="kbd kbd-xs">1</kbd>
                  <kbd className="kbd kbd-xs">2</kbd>
                </span>
              </p>
            </div>
          </div>

          <div
            className="animate-rise mx-auto hidden w-full min-w-0 lg:block"
            style={{ animationDelay: "100ms" }}
            aria-hidden
          >
            <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-md">
              <figure className="landing-hero-figure aspect-[5/4] bg-gradient-to-br from-primary/12 via-base-100 to-secondary/10">
                <div className="grid h-full w-full place-items-center p-8 lg:p-12">
                  <div className="stack w-full max-w-md gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge badge-soft badge-primary badge-sm">
                        Station 1
                      </span>
                      <span className="inline-flex gap-0.5">
                        <kbd className="kbd kbd-xs">1</kbd>
                        <kbd className="kbd kbd-xs">2</kbd>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="aspect-[5/3] rounded-box border border-base-300 bg-base-200/80" />
                      <div className="aspect-[5/3] rounded-box border border-primary/25 bg-primary/10" />
                    </div>
                    <progress
                      className="progress progress-primary w-full"
                      value={40}
                      max={100}
                    />
                  </div>
                </div>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-base-300 bg-base-100">
        <div className="page-shell page-shell-wide py-12 md:py-16">
          <div className="mb-8 max-w-2xl text-center md:text-left">
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
                n: "01",
                title: "Bildaufgaben",
                body: "Zwei Wege tippen oder Taste 1 · 2 — ohne Jargon.",
              },
              {
                n: "02",
                title: "Lokaler Speicher",
                body: "Antworten bleiben im Browser — kein Cloud-Zwang.",
              },
              {
                n: "03",
                title: "Orientierung",
                body: "HOW & WHAT fürs Coaching — keine Diagnose.",
              },
            ].map((card) => (
              <article
                key={card.title}
                className="card border border-base-300 bg-base-100 shadow-sm"
              >
                <div className="card-body gap-2 p-6">
                  <span className="badge badge-ghost badge-sm w-fit font-mono">
                    {card.n}
                  </span>
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
