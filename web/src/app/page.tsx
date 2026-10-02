import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden">
      <section className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between gap-8 px-5 pb-[max(1.5rem,var(--safe-bottom))] pt-[max(1.25rem,var(--safe-top))] md:gap-10 md:px-8 md:py-10">
        <div className="flex items-center justify-between gap-3">
          <span className="glass-chip">Coaching · Orientierung</span>
          <Link
            href="/profile"
            className="glass-chip min-h-11 text-[var(--muted-strong)]"
          >
            Profile
          </Link>
        </div>

        <div className="relative my-auto flex flex-1 flex-col items-center justify-center text-center">
          <div
            className="animate-rise pointer-events-none absolute inset-x-0 top-[42%] mx-auto h-[56vw] max-h-[380px] w-[90%] max-w-[640px] -translate-y-1/2 md:h-[42vh]"
            aria-hidden
          >
            <div className="glass-panel absolute inset-0 rotate-[-3deg] scale-[0.96] opacity-35" />
            <div className="glass-panel absolute inset-0 rotate-[2.5deg] scale-[0.98] opacity-55" />
            <div className="glass-panel glass-panel-strong glass-sheen absolute inset-0 overflow-hidden">
              <div className="absolute -left-8 top-8 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(94,200,214,0.32),transparent_70%)] blur-2xl" />
              <div className="absolute bottom-2 right-2 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(216,137,154,0.22),transparent_70%)] blur-2xl" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-24 w-24 rounded-full border border-white/22 bg-white/[0.07] backdrop-blur-md md:h-32 md:w-32" />
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-5 px-2">
            <p
              className="animate-rise display-title text-6xl text-[var(--ink)] sm:text-7xl md:text-8xl"
              style={{ animationDelay: "40ms" }}
            >
              Skill<span className="neon-text">ster</span>
            </p>
            <h1
              className="animate-rise mx-auto max-w-lg text-xl font-medium leading-snug tracking-tight text-[var(--muted-strong)] sm:text-2xl md:text-[1.65rem]"
              style={{ animationDelay: "120ms" }}
            >
              Dein Arbeitsmuster — in Bildern.
            </h1>
            <p
              className="animate-rise mx-auto max-w-sm text-[0.95rem] leading-relaxed text-[var(--muted)] md:text-base"
              style={{ animationDelay: "180ms" }}
            >
              Tippen. Erkennen. Klarheit für den Berufsweg.
            </p>
          </div>
        </div>

        <div
          className="animate-rise relative z-10 mx-auto flex w-full max-w-md flex-col gap-3 pb-1"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href="/assessment"
            className="glass-btn glass-btn-primary min-h-12 w-full text-base"
          >
            Jetzt starten
          </Link>
          <p className="meta-label text-center normal-case tracking-[0.04em]">
            Privat · mobil · Zwischenspeicher
          </p>
        </div>
      </section>
    </main>
  );
}
