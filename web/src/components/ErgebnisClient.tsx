"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { RIASEC_IDS, RIASEC_LABELS } from "@/lib/constants";
import type { OccupationSeed } from "@/lib/occupations";
import { scoreAssessment } from "@/lib/scoring";
import { loadAnswers } from "@/lib/session";
import type { AssessmentItem, VistProfile } from "@/lib/types";

type Props = {
  items: AssessmentItem[];
  profiles: VistProfile[];
  occupations: OccupationSeed[];
};

export function ErgebnisClient({ items, profiles, occupations }: Props) {
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    setAnswers(loadAnswers());
    setReady(true);
  }, []);

  const result = useMemo(() => {
    if (!answers) return null;
    return scoreAssessment(items, answers, profiles, occupations);
  }, [answers, items, profiles, occupations]);

  if (!ready) {
    return (
      <main className="flex flex-1 flex-col">
        <SiteHeader />
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-[var(--muted)]">
          Ergebnis wird geladen…
        </div>
      </main>
    );
  }

  if (!answers || !result || !result.answeredCount) {
    return (
      <main className="flex flex-1 flex-col">
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-[var(--muted)]">Noch kein Durchlauf gespeichert.</p>
          <Link href="/assessment" className="glass-btn glass-btn-primary">
            Test starten
          </Link>
        </div>
      </main>
    );
  }

  const primary = profiles.find((p) => p.code === result.primaryCode);
  const riasecSorted = [...RIASEC_IDS].sort(
    (a, b) => result.riasec[b] - result.riasec[a],
  );
  const maxRiasec = Math.max(...RIASEC_IDS.map((id) => result.riasec[id]), 1);

  return (
    <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
      <SiteHeader
        right={
          <Link href="/assessment" className="glass-chip text-[var(--neon-cyan)]">
            Nochmal
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 md:space-y-6 md:py-10">
        <section className="glass-panel glass-panel-strong glass-sheen animate-rise space-y-4 p-6 md:p-8">
          <span className="glass-chip">Dein Ergebnis</span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] md:text-5xl">
            {primary?.role ?? result.primaryCode}
            <span className="ml-2 text-xl text-[var(--neon-cyan)] md:text-2xl">
              {result.primaryCode}
            </span>
          </h1>
          <div className="space-y-3 text-base leading-relaxed text-[var(--muted)] md:text-lg">
            {result.plainSummary.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)]">
            Beantwortet: {result.answeredCount}/{result.itemCount}
          </p>
        </section>

        <section className="glass-panel space-y-4 p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Deine Richtungen
          </h2>
          <div className="space-y-3">
            {result.axes.map((axis) => {
              const pct = (axis.value + 100) / 2;
              return (
                <div key={axis.id} className="space-y-1.5">
                  <div className="flex justify-between gap-2 text-xs text-[var(--muted)] md:text-sm">
                    <span>{axis.poleLow}</span>
                    <span>{axis.poleHigh}</span>
                  </div>
                  <div className="glass-progress">
                    <span
                      style={{
                        width: `${Math.max(8, Math.min(100, pct))}%`,
                        background:
                          "linear-gradient(90deg, #39f3ff, #7dffb2, #ff6b9d)",
                      }}
                    />
                  </div>
                  <p className="text-sm text-[var(--ink)]">{axis.plain}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] md:text-2xl">
            Ähnliche Muster
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Kein Mensch ist nur ein Typ — Überlappungen sind normal.
          </p>
          <div className="grid gap-2">
            {result.clusters.map((cluster) => (
              <div
                key={cluster.code}
                className="glass-panel flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <div className="font-semibold text-[var(--ink)]">
                    {cluster.role}{" "}
                    <span className="text-[var(--muted)]">({cluster.code})</span>
                  </div>
                  {cluster.isZwischen ? (
                    <div className="text-xs text-[var(--neon-mint)]">
                      Zwischenprofil
                    </div>
                  ) : null}
                </div>
                <div className="text-sm font-semibold text-[var(--neon-cyan)]">
                  {Math.round(cluster.weight * 100)}%
                </div>
              </div>
            ))}
          </div>
          {result.zwischenLabels.length > 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Gemischt: {result.zwischenLabels.join(" · ")}
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] md:text-2xl">
              HOW — So arbeitest du
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Persönlichkeit und Arbeitsstil.
            </p>
          </div>
          {result.howBullets.map((block) => (
            <div key={block.title} className="glass-panel space-y-2 p-4 md:p-5">
              <h3 className="font-semibold text-[var(--ink)]">{block.title}</h3>
              <ul className="space-y-2 text-sm leading-relaxed text-[var(--muted)] md:text-base">
                {block.bullets.map((b) => (
                  <li key={b} className="rounded-xl bg-white/5 px-3 py-2">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {result.blendBullets.length ? (
            <div className="glass-panel space-y-2 p-4 md:p-5">
              <h3 className="font-semibold text-[var(--neon-coral)]">
                Auch aus benachbarten Mustern
              </h3>
              <ul className="space-y-2 text-sm text-[var(--muted)] md:text-base">
                {result.blendBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] md:text-2xl">
              WHAT — Was dich anzieht
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Interessen (RIASEC {result.riasecCode || "—"}) und passende
              Berufsfelder.
            </p>
          </div>

          <div className="glass-panel space-y-3 p-4 md:p-5">
            {riasecSorted.map((id) => {
              const value = Math.max(result.riasec[id], 0);
              const width = Math.round((value / maxRiasec) * 100);
              return (
                <div key={id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[var(--ink)]">
                      {RIASEC_LABELS[id]}
                    </span>
                    <span className="text-[var(--muted)]">{id}</span>
                  </div>
                  <div className="glass-progress">
                    <span
                      style={{
                        width: `${Math.max(value > 0 ? 8 : 0, width)}%`,
                        background: "linear-gradient(90deg, #39f3ff, #7dffb2)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-2">
            {result.occupations.map((job) => (
              <div key={job.id} className="glass-panel px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-[var(--ink)]">
                    {job.titleDe}
                  </div>
                  <div className="shrink-0 text-xs font-medium text-[var(--neon-mint)]">
                    {job.riasec}
                  </div>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{job.why}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
