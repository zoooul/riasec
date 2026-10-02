import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Chip } from "@/components/ui/chip";
import {
  getProfile,
  listProfileCodes,
  SECTION_LABELS,
} from "@/lib/profiles.server";

type Props = {
  params: Promise<{ code: string }>;
};

export function generateStaticParams() {
  return listProfileCodes().map((code) => ({ code: code.toLowerCase() }));
}

export default async function ProfileDetailPage({ params }: Props) {
  const { code } = await params;
  const upper = code.toUpperCase();
  if (!listProfileCodes().includes(upper)) notFound();
  const profile = getProfile(upper);

  return (
    <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
      <SiteHeader right={<Chip href="/profile">Alle Profile</Chip>} />

      <div className="page-shell stack-lg py-8 md:py-10">
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-2 p-5 md:p-7">
            <h1 className="card-title display-title mb-0 text-3xl text-base-content md:text-5xl">
              {profile.role}
            </h1>
            <p className="text-primary">
              {profile.code} · {profile.dimensions.E_I}
              {profile.dimensions.S_N}
              {profile.dimensions.T_F}
              {profile.dimensions.J_P}
            </p>
          </div>
        </div>

        <div className="stack">
          {Object.entries(profile.sections).map(([key, bullets]) => (
            <section
              key={key}
              className="card border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="card-body gap-3 p-4 md:p-5">
                <h2 className="card-title mb-0 text-lg font-semibold text-base-content">
                  {SECTION_LABELS[key] ?? key}
                </h2>
                <ul className="space-y-2">
                  {bullets.slice(0, 8).map((b) => (
                    <li
                      key={b}
                      className="rounded-lg bg-base-200 px-3 py-2 text-sm leading-relaxed text-base-content/70 md:text-base"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
