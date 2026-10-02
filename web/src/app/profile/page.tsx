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
          <Chip href="/assessment" className="text-[var(--neon-mint)]">
            Zum Test
          </Chip>
        }
      />

      <div className="page-shell page-shell-wide stack-lg min-w-0 py-8 md:py-10">
        <div className="stack-sm relative z-[1]">
          <h1 className="display-title text-3xl text-[var(--ink)] md:text-5xl">
            16 Profile
          </h1>
          <p className="max-w-2xl text-[var(--muted)]">
            Ergebnisbausteine — später gemischt mit deinen Scores und Zwischenprofilen.
          </p>
        </div>

        <div className="relative z-[1] grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <Link
              key={p.code}
              href={`/profile/${p.code.toLowerCase()}`}
              className="glass-panel glass-choice min-w-0 px-5 py-4"
            >
              <div className="relative z-[1] text-sm text-[var(--neon-cyan)]">{p.code}</div>
              <div className="relative z-[1] display-title text-2xl text-[var(--ink)]">
                {p.role}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
