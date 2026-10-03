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
          <Chip href="/assessment" className="badge-secondary">
            Zum Test
          </Chip>
        }
      />

      <div className="page-shell page-shell-wide stack-lg py-8 md:py-10">
        <div className="stack-sm">
          <h1 className="display-title text-3xl text-base-content md:text-5xl">
            16 Profile
          </h1>
          <p className="max-w-2xl text-base-content/60">
            Ergebnisbausteine — später gemischt mit deinen Scores und Zwischenprofilen.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {profiles.map((p) => (
            <Link
              key={p.code}
              href={`/profile/${p.code.toLowerCase()}`}
              className="card bg-base-100 border border-base-300 shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="card-body gap-1 px-5 py-4">
                <div className="text-sm text-primary">{p.code}</div>
                <div className="display-title text-2xl text-base-content">
                  {p.role}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
