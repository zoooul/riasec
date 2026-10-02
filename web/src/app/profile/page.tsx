import Link from "next/link";
import { getAllProfiles } from "@/lib/profiles";

export default function ProfileIndexPage() {
  const profiles = getAllProfiles().sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]"
        >
          Skillster
        </Link>
        <Link href="/assessment" className="text-sm text-[var(--accent)]">
          Zum Test
        </Link>
      </header>

      <h1 className="mb-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        16 Profile
      </h1>
      <p className="mb-8 max-w-2xl text-[var(--muted)]">
        Ergebnisbausteine aus deiner VIST-Quelle. Später werden sie mit
        Scores und Zwischenprofilen gemischt.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {profiles.map((p) => (
          <Link
            key={p.code}
            href={`/profile/${p.code.toLowerCase()}`}
            className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-5 py-4 transition hover:border-[var(--accent)]"
          >
            <div className="text-sm text-[var(--muted)]">{p.code}</div>
            <div className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {p.role}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
