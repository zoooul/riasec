import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getAllProfiles } from "@/lib/profiles";

export default function ProfileIndexPage() {
  const profiles = getAllProfiles().sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  return (
    <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
      <SiteHeader
        right={
          <Link href="/assessment" className="glass-chip text-[var(--neon-mint)]">
            Zum Test
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-10">
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] md:text-5xl">
          16 Profile
        </h1>
        <p className="mb-8 max-w-2xl text-[var(--muted)]">
          Ergebnisbausteine — später gemischt mit deinen Scores und Zwischenprofilen.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {profiles.map((p) => (
            <Link
              key={p.code}
              href={`/profile/${p.code.toLowerCase()}`}
              className="glass-panel glass-choice px-5 py-4"
            >
              <div className="text-sm text-[var(--neon-cyan)]">{p.code}</div>
              <div className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {p.role}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
