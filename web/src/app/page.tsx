import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-10 px-6 py-16">
        <p className="animate-rise font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--ink)] md:text-7xl">
          Skillster
        </p>
        <div className="animate-rise max-w-xl space-y-4" style={{ animationDelay: "80ms" }}>
          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--ink)] md:text-4xl">
            Finde heraus, wie du arbeitest — und welche Felder zu dir passen.
          </h1>
          <p className="text-lg leading-relaxed text-[var(--muted)]">
            Ein paar Bildentscheidungen. Wenig Text. Am Ende ein klares Bild
            mit Hauptmuster, Zwischenprofilen und Orientierung fürs Coaching.
          </p>
        </div>
        <div
          className="animate-rise flex flex-wrap items-center gap-4"
          style={{ animationDelay: "160ms" }}
        >
          <Link
            href="/assessment"
            className="rounded-full bg-[var(--accent)] px-7 py-3.5 text-base font-semibold text-white transition hover:brightness-110"
          >
            Jetzt starten
          </Link>
          <Link
            href="/profile"
            className="rounded-full border border-[var(--line)] bg-[var(--card)] px-6 py-3.5 text-base text-[var(--ink)]"
          >
            Profile ansehen
          </Link>
        </div>
        <p className="animate-rise text-sm text-[var(--muted)]" style={{ animationDelay: "220ms" }}>
          Privat · lokal · noch unvalidiert · Quellen: IPIP / O*NET® / ESCO /
          eigene Bilditems
        </p>
      </div>
    </main>
  );
}
