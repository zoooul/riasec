import Link from "next/link";
import { getMvpItems } from "@/lib/items";
import { getProfile, SECTION_LABELS } from "@/lib/profiles";
import { scoreAssessment } from "@/lib/scoring";

type Props = {
  searchParams: Promise<{ a?: string }>;
};

export default async function ErgebnisPage({ searchParams }: Props) {
  const params = await searchParams;
  const items = getMvpItems();
  let answers: Record<string, string> = {};
  try {
    answers = params.a
      ? (JSON.parse(decodeURIComponent(params.a)) as Record<string, string>)
      : {};
  } catch {
    answers = {};
  }

  const result = scoreAssessment(items, answers);
  const profile = getProfile(result.primaryCode);
  const highlightSections = [
    "staerken",
    "motivation",
    "rolle_im_team",
    "stress",
  ] as const;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]"
        >
          Skillster
        </Link>
        <Link href="/assessment" className="text-sm text-[var(--accent)]">
          Nochmal machen
        </Link>
      </header>

      <section className="animate-rise space-y-4 rounded-[2rem] border border-[var(--line)] bg-[var(--card)] p-8 shadow-[0_20px_50px_rgba(21,34,42,0.08)]">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
          Dein Ergebnis
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          {profile.role}
          <span className="ml-3 text-2xl text-[var(--muted)]">
            {profile.code}
          </span>
        </h1>
        <div className="space-y-3 text-lg leading-relaxed text-[var(--muted)]">
          {result.plainSummary.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Ähnliche Muster
        </h2>
        <div className="grid gap-3">
          {result.clusters.map((cluster) => (
            <div
              key={cluster.code}
              className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3"
            >
              <div>
                <div className="font-semibold text-[var(--ink)]">
                  {cluster.role}{" "}
                  <span className="text-[var(--muted)]">({cluster.code})</span>
                </div>
                {cluster.isZwischen ? (
                  <div className="text-xs text-[var(--accent)]">
                    Zwischenprofil / Überlappung
                  </div>
                ) : null}
              </div>
              <div className="text-sm font-medium text-[var(--accent)]">
                {Math.round(cluster.weight * 100)}%
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          So arbeitest du
        </h2>
        {highlightSections.map((key) => {
          const bullets = profile.sections[key]?.slice(0, 4) ?? [];
          if (!bullets.length) return null;
          return (
            <div key={key} className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--ink)]">
                {SECTION_LABELS[key] ?? key}
              </h3>
              <ul className="space-y-2 text-[var(--muted)]">
                {bullets.map((b) => (
                  <li
                    key={b}
                    className="rounded-xl bg-[var(--card)]/80 px-4 py-3 leading-relaxed"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </main>
  );
}
