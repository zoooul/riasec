"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { RIASEC_IDS, RIASEC_LABELS } from "@/lib/constants";
import type { OccupationSeed } from "@/lib/occupations";
import { scoreAssessment } from "@/lib/scoring";
import { clearAnswers, loadAnswers } from "@/lib/session";
import type { AssessmentItem, VistProfile } from "@/lib/types";

type Props = {
  items: AssessmentItem[];
  profiles: VistProfile[];
  occupations: OccupationSeed[];
};

function copySummary(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("clipboard unavailable"));
}

export function ErgebnisClient({ items, profiles, occupations }: Props) {
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string> | null>(null);
  const [howOpen, setHowOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

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
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-[var(--muted-strong)]">
          Ergebnis wird geladen…
        </div>
      </main>
    );
  }

  if (!answers || !result || !result.answeredCount) {
    return (
      <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Noch kein Ergebnis
          </h1>
          <p className="text-[var(--muted-strong)]">
            Starte den Bild-Test — danach erscheint hier dein Muster.
          </p>
          <Link
            href="/assessment"
            className="glass-btn glass-btn-primary min-h-11 w-full max-w-xs"
          >
            Test starten
          </Link>
        </div>
      </main>
    );
  }

  if (result.isIncomplete) {
    return (
      <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Noch nicht fertig
          </h1>
          <p className="text-[var(--muted-strong)]">
            {result.coverageHint}. Mach weiter, damit das Ergebnis stabiler
            wird.
          </p>
          <Link
            href="/assessment"
            className="glass-btn glass-btn-primary min-h-11 w-full max-w-xs"
          >
            Weiter im Test
          </Link>
          <button
            type="button"
            onClick={() => setConfirmRestart(true)}
            className="min-h-11 text-sm text-[var(--neon-coral)] underline-offset-2 hover:underline"
          >
            Neu starten
          </button>
          {confirmRestart ? (
            <div className="glass-panel w-full space-y-3 p-4 text-left">
              <p className="text-sm text-[var(--muted-strong)]">
                Antworten wirklich löschen?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="glass-btn glass-btn-primary min-h-11 px-4 text-sm"
                  onClick={() => {
                    clearAnswers();
                    setAnswers({});
                    setConfirmRestart(false);
                  }}
                >
                  Ja, löschen
                </button>
                <button
                  type="button"
                  className="glass-btn glass-btn-secondary min-h-11 px-4 text-sm"
                  onClick={() => setConfirmRestart(false)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  const primary = profiles.find((p) => p.code === result.primaryCode);
  const riasecSorted = [...RIASEC_IDS].sort(
    (a, b) => result.riasec[b] - result.riasec[a],
  );
  const maxRiasec = Math.max(...RIASEC_IDS.map((id) => result.riasec[id]), 1);
  const topJobs = result.occupations.slice(0, 3);
  const summaryText = [
    `Skillster — ${primary?.role ?? result.primaryCode} (${result.primaryCode})`,
    ...result.plainSummary,
    result.zwischenLabels.length
      ? `Gemischt: ${result.zwischenLabels.join("; ")}`
      : "",
    topJobs.length
      ? `Berufe: ${topJobs.map((j) => j.titleDe).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  async function onCopy() {
    try {
      await copySummary(summaryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
      <SiteHeader
        right={
          <button
            type="button"
            onClick={() => setConfirmRestart(true)}
            className="glass-chip min-h-11 text-[var(--neon-cyan)]"
          >
            Nochmal
          </button>
        }
      />

      <div className="mx-auto w-full max-w-3xl space-y-5 overflow-x-hidden px-4 py-6 md:space-y-6 md:py-10">
        {confirmRestart ? (
          <div
            className="glass-panel glass-panel-strong space-y-3 p-4"
            role="alertdialog"
            aria-labelledby="ergebnis-restart-title"
          >
            <h2
              id="ergebnis-restart-title"
              className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]"
            >
              Test neu starten?
            </h2>
            <p className="text-sm text-[var(--muted-strong)]">
              Dein aktuelles Ergebnis wird aus dem Zwischenspeicher gelöscht.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/assessment"
                className="glass-btn glass-btn-primary min-h-11 px-5 text-sm"
                onClick={() => clearAnswers()}
              >
                Ja, neu starten
              </Link>
              <button
                type="button"
                className="glass-btn glass-btn-secondary min-h-11 px-5 text-sm"
                onClick={() => setConfirmRestart(false)}
              >
                Behalten
              </button>
            </div>
          </div>
        ) : null}

        <section className="glass-panel glass-panel-strong glass-sheen animate-rise space-y-4 p-6 md:p-8">
          <span className="glass-chip">Dein Ergebnis</span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--ink)] md:text-5xl">
            {primary?.role ?? result.primaryCode}
          </h1>
          <p className="text-lg text-[var(--neon-cyan)] md:text-xl">
            {result.primaryCode}
          </p>
          <p className="text-base leading-relaxed text-[var(--muted-strong)] md:text-lg">
            {result.plainSummary[0]}
          </p>
          {result.plainSummary[1] ? (
            <p className="text-sm leading-relaxed text-[var(--muted-strong)] md:text-base">
              {result.plainSummary[1]}
            </p>
          ) : null}
          <p className="text-sm font-medium text-[var(--neon-mint)]">
            {result.coverageHint}
            {result.confidence === "medium" ? " · noch unsicher" : ""}
            {result.confidence === "low" ? " · grobe Richtung" : ""}
          </p>
        </section>

        <section className="glass-panel space-y-4 p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Deine Richtungen
          </h2>
          <div className="space-y-5">
            {result.axes.map((axis) => {
              const pct = (axis.value + 100) / 2;
              return (
                <div key={axis.id} className="space-y-2">
                  <div className="flex justify-between gap-3 text-sm font-medium text-[var(--ink)]">
                    <span className="max-w-[45%] leading-snug">
                      {axis.poleLow}
                    </span>
                    <span className="max-w-[45%] text-right leading-snug">
                      {axis.poleHigh}
                    </span>
                  </div>
                  <div className="glass-progress glass-progress-lg">
                    <span
                      style={{
                        width: `${Math.max(8, Math.min(100, pct))}%`,
                        background:
                          "linear-gradient(90deg, #39f3ff, #7dffb2, #ff6b9d)",
                      }}
                    />
                  </div>
                  <p className="text-sm text-[var(--muted-strong)]">
                    {axis.plain}
                  </p>
                </div>
              );
            })}
          </div>
          {result.zwischenLabels.length > 0 ? (
            <p className="text-sm text-[var(--neon-mint)]">
              Gemischt: {result.zwischenLabels.join(" · ")}
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] md:text-2xl">
            Ähnliche Muster
          </h2>
          <p className="text-sm text-[var(--muted-strong)]">
            Überlappungen sind normal — kein Mensch ist nur ein Typ.
          </p>
          <div className="grid gap-2">
            {result.clusters.map((cluster) => (
              <div
                key={cluster.code}
                className="glass-panel flex min-h-11 items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <div className="font-semibold text-[var(--ink)]">
                    {cluster.role}{" "}
                    <span className="text-[var(--muted-strong)]">
                      ({cluster.code})
                    </span>
                  </div>
                  {cluster.isZwischen ? (
                    <div className="text-xs text-[var(--neon-mint)]">
                      Nahes Zwischenprofil
                    </div>
                  ) : null}
                </div>
                <div className="text-sm font-semibold text-[var(--neon-cyan)]">
                  {Math.round(cluster.weight * 100)}%
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] md:text-2xl">
                HOW — So arbeitest du
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-strong)]">
                Persönlichkeit und Arbeitsstil.
              </p>
            </div>
            <button
              type="button"
              className="glass-chip min-h-11 text-[var(--neon-cyan)]"
              aria-expanded={howOpen}
              onClick={() => setHowOpen((v) => !v)}
            >
              {howOpen ? "Weniger" : "Mehr lesen"}
            </button>
          </div>
          {(howOpen ? result.howBullets : result.howBullets.slice(0, 1)).map(
            (block) => (
              <div
                key={block.title}
                className="glass-panel space-y-2 p-4 md:p-5"
              >
                <h3 className="font-semibold text-[var(--ink)]">{block.title}</h3>
                <ul className="space-y-2 text-sm leading-relaxed text-[var(--muted-strong)] md:text-base">
                  {(howOpen ? block.bullets : block.bullets.slice(0, 2)).map(
                    (b) => (
                      <li key={b} className="rounded-xl bg-white/5 px-3 py-2">
                        {b}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ),
          )}
          {howOpen && result.blendBullets.length ? (
            <div className="glass-panel space-y-2 border border-[var(--neon-coral)]/25 p-4 md:p-5">
              <h3 className="font-semibold text-[var(--neon-coral)]">
                Auch aus benachbarten Mustern
              </h3>
              <ul className="space-y-2 text-sm text-[var(--muted-strong)] md:text-base">
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
            <p className="mt-1 text-sm text-[var(--muted-strong)]">
              Interessen ({result.riasecCode || "—"}) und passende Berufe.
            </p>
          </div>

          <div className="glass-panel space-y-3 p-4 md:p-5">
            {riasecSorted.map((id) => {
              const value = Math.max(result.riasec[id], 0);
              const width = Math.round((value / maxRiasec) * 100);
              return (
                <div key={id} className="space-y-1.5">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-medium text-[var(--ink)]">
                      {RIASEC_LABELS[id]}
                    </span>
                    <span className="shrink-0 text-[var(--muted-strong)]">
                      {id}
                    </span>
                  </div>
                  <div className="glass-progress glass-progress-lg">
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

          <h3 className="pt-1 text-base font-semibold text-[var(--ink)]">
            Drei Berufe zum Ausprobieren
          </h3>
          {topJobs.length === 0 ? (
            <p className="text-sm text-[var(--muted-strong)]">
              Noch keine Berufstreffer — mehr Antworten helfen.
            </p>
          ) : (
            <div className="grid gap-2">
              {topJobs.map((job, i) => (
                <div key={job.id} className="glass-panel px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium text-[var(--neon-mint)]">
                        {i + 1}. Vorschlag
                      </div>
                      <div className="font-semibold text-[var(--ink)]">
                        {job.titleDe}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs font-medium text-[var(--muted-strong)]">
                      {job.riasec}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted-strong)]">
                    {job.why}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 pb-4">
          <Link
            href="/assessment"
            className="glass-btn glass-btn-primary min-h-11 w-full text-base"
          >
            Zurück zum Test
          </Link>
          <button
            type="button"
            onClick={onCopy}
            className="glass-btn glass-btn-secondary min-h-11 w-full text-base"
          >
            {copied ? "Kopiert" : "Kurzfassung kopieren"}
          </button>
        </section>
      </div>
    </main>
  );
}
