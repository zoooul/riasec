import Link from "next/link";
import { notFound } from "next/navigation";
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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/profile" className="text-sm text-[var(--accent)]">
          ← Alle Profile
        </Link>
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]"
        >
          Skillster
        </Link>
      </header>

      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        {profile.role}
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        {profile.code} · {profile.dimensions.E_I}
        {profile.dimensions.S_N}
        {profile.dimensions.T_F}
        {profile.dimensions.J_P}
      </p>

      <div className="mt-10 space-y-8">
        {Object.entries(profile.sections).map(([key, bullets]) => (
          <section key={key}>
            <h2 className="mb-3 text-xl font-semibold text-[var(--ink)]">
              {SECTION_LABELS[key] ?? key}
            </h2>
            <ul className="space-y-2">
              {bullets.slice(0, 8).map((b) => (
                <li
                  key={b}
                  className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-[var(--muted)]"
                >
                  {b}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
