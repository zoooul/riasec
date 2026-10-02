import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getProfile, listProfileCodes, SECTION_LABELS } from "@/lib/profiles";

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
      <SiteHeader
        right={
          <Link href="/profile" className="glass-chip">
            Alle Profile
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-10">
        <div className="glass-panel glass-panel-strong glass-sheen mb-8 space-y-2 p-6 md:p-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] md:text-5xl">
            {profile.role}
          </h1>
          <p className="text-[var(--neon-cyan)]">
            {profile.code} · {profile.dimensions.E_I}
            {profile.dimensions.S_N}
            {profile.dimensions.T_F}
            {profile.dimensions.J_P}
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(profile.sections).map(([key, bullets]) => (
            <section key={key} className="glass-panel p-4 md:p-5">
              <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">
                {SECTION_LABELS[key] ?? key}
              </h2>
              <ul className="space-y-2">
                {bullets.slice(0, 8).map((b) => (
                  <li
                    key={b}
                    className="rounded-xl bg-white/5 px-3 py-2 text-sm leading-relaxed text-[var(--muted)] md:text-base"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
