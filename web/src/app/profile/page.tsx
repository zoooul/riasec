import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Chip } from "@/components/ui/chip";
import { getAllProfiles } from "@/lib/profiles.server";

export default function ProfileIndexPage() {
  const profiles = getAllProfiles().sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  return (
    <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
      <SiteHeader
        right={
          <Chip asChild className="text-[var(--neon-mint)]">
            <Link href="/assessment">Zum Test</Link>
          </Chip>
        }
      />

      <div className="page-shell page-shell-wide stack-lg py-8 md:py-10">
        <div className="stack-sm">
          <h1 className="display-title text-3xl text-[var(--ink)] md:text-5xl">
            16 Profile
          </h1>
          <p className="max-w-2xl text-[var(--muted)]">
            Ergebnisbausteine — später gemischt mit deinen Scores und Zwischenprofilen.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <Link
              key={p.code}
              href={`/profile/${p.code.toLowerCase()}`}
              className="glass-panel glass-choice px-5 py-4"
            >
              <div className="text-sm text-[var(--neon-cyan)]">{p.code}</div>
              <div className="display-title text-2xl text-[var(--ink)]">
                {p.role}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
