import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col">
      {/* Full-bleed hero composition — brand first, one job */}
      <section className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between px-5 pb-[max(1.5rem,var(--safe-bottom))] pt-[max(1.25rem,var(--safe-top))] md:px-8 md:py-10">
        <div className="flex items-center justify-between">
          <span className="glass-chip">Coaching · Orientierung</span>
          <Link href="/profile" className="glass-chip text-[var(--muted)]">
            Profile
          </Link>
        </div>

        <div className="relative my-8 flex flex-1 flex-col items-center justify-center text-center md:my-0">
          {/* Dominant glass visual plane */}
          <div
            className="animate-rise pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[58vw] max-h-[420px] w-[92%] max-w-[720px] -translate-y-[58%] md:h-[48vh]"
            aria-hidden
          >
            <div className="glass-panel glass-sheen absolute inset-0 rotate-[-4deg] scale-[0.96] opacity-50" />
            <div className="glass-panel glass-sheen absolute inset-0 rotate-[3deg] scale-[0.98] opacity-70" />
            <div className="glass-panel glass-panel-strong glass-sheen absolute inset-0 overflow-hidden">
              <div className="absolute -left-10 top-6 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(57,243,255,0.55),transparent_70%)] blur-2xl" />
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,107,157,0.45),transparent_70%)] blur-2xl" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-28 w-28 rounded-full border border-white/30 bg-white/10 shadow-[0_0_50px_rgba(57,243,255,0.35)] backdrop-blur-md md:h-36 md:w-36" />
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-5 px-2">
            <p
              className="animate-rise font-[family-name:var(--font-display)] text-6xl font-semibold tracking-tight text-[var(--ink)] drop-shadow-[0_0_28px_rgba(57,243,255,0.25)] sm:text-7xl md:text-8xl"
              style={{ animationDelay: "40ms" }}
            >
              Skill<span className="neon-text">ster</span>
            </p>
            <h1
              className="animate-rise mx-auto max-w-xl font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--ink)] sm:text-3xl md:text-4xl"
              style={{ animationDelay: "120ms" }}
            >
              Finde dein Arbeitsmuster — in Bildern, nicht in Fragebögen.
            </h1>
            <p
              className="animate-rise mx-auto max-w-md text-base leading-relaxed text-[var(--muted)] md:text-lg"
              style={{ animationDelay: "180ms" }}
            >
              Tippen. Erkennen. Klarheit für Coaching und Berufsweg.
            </p>
          </div>
        </div>

        <div
          className="animate-rise relative z-10 mx-auto flex w-full max-w-md flex-col gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Link href="/assessment" className="glass-btn glass-btn-primary w-full text-base">
            Jetzt starten
          </Link>
          <p className="text-center text-xs text-[var(--muted)] md:text-sm">
            Privat · mobil · Zwischenprofile inklusive
          </p>
        </div>
      </section>
    </main>
  );
}
