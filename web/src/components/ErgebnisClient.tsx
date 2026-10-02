"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { RIASEC_IDS, RIASEC_LABELS } from "@/lib/constants";
import type { OccupationSeed } from "@/lib/occupations";
import { downloadProfilePdf } from "@/lib/profilePdf";
import { scoreAssessment } from "@/lib/scoring";
import { clearAnswers, loadAnswers } from "@/lib/session";
import type { AssessmentItem, QualityLabel, VistProfile } from "@/lib/types";

type Attribution = { id: string; name: string; license: string; url: string };

type Props = {
  items: AssessmentItem[];
  profiles: VistProfile[];
  occupations: OccupationSeed[];
  attribution?: Attribution[];
};

function qualityChip(label: QualityLabel | undefined): {
  text: string;
  className: string;
} {
  if (label === "orientierung") {
    return { text: "Nur Orientierung", className: "text-[var(--neon-coral)]" };
  }
  if (label === "unsicher") {
    return {
      text: "Etwas unsicher",
      className: "text-[var(--neon-mint)]",
    };
  }
  return { text: "Dein Ergebnis", className: "text-[var(--neon-cyan)]" };
}

function copySummary(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("clipboard unavailable"));
}

function subscribeNoop() {
  return () => {};
}

function getServerAnswers(): Record<string, string> | null {
  return null;
}

export function ErgebnisClient({
  items,
  profiles,
  occupations,
  attribution = [],
}: Props) {
  const answers = useSyncExternalStore(
    subscribeNoop,
    loadAnswers,
    getServerAnswers,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [localAnswers, setLocalAnswers] = useState<Record<
    string,
    string
  > | null>(null);

  const effectiveAnswers = localAnswers ?? answers;

  const result = useMemo(() => {
    if (!effectiveAnswers) return null;
    return scoreAssessment(items, effectiveAnswers, profiles, occupations);
  }, [effectiveAnswers, items, profiles, occupations]);

  if (answers === null && localAnswers === null) {
    return (
      <main className="flex flex-1 flex-col">
        <SiteHeader />
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-[var(--muted)]">
          Ergebnis wird geladen…
        </div>
      </main>
    );
  }

  if (!result || !result.answeredCount) {
    return (
      <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Noch kein Ergebnis
          </h1>
          <p className="text-[var(--muted)]">
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
          <p className="text-[var(--muted)]">
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
              <p className="text-sm text-[var(--muted)]">
                Antworten wirklich löschen?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="glass-btn glass-btn-primary min-h-11 px-4 text-sm"
                  onClick={() => {
                    clearAnswers();
                    setLocalAnswers({});
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

  const plain = result.plainProfile;
  const chip = qualityChip(result.qualityLabel);
  const coverageChip = [
    result.coverageHint,
    result.confidence === "medium" ? "noch unsicher" : null,
    result.confidence === "low" ? "grobe Richtung" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const confidenceNote =
    result.confidence === "low"
      ? "Sicherheit eher niedrig — nur eine grobe Richtung."
      : result.confidence === "medium"
        ? "Sicherheit mittel — nimm es als Hinweis, nicht als Urteil."
        : null;
  const jobFields = result.occupations.slice(0, 3);
  const riasecSorted = [...RIASEC_IDS].sort(
    (a, b) => result.riasec[b] - result.riasec[a],
  );
  const maxRiasec = Math.max(...RIASEC_IDS.map((id) => result.riasec[id]), 1);
  const summaryText = [
    `Skillster — ${plain.roleLabel} (${result.primaryCode})`,
    plain.oneLine,
    ...result.plainSummary,
    result.zwischenLabels.length
      ? `Gemischt: ${result.zwischenLabels.join("; ")}`
      : "",
    jobFields.length
      ? `Berufe: ${jobFields.map((j) => j.titleDe).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  function onSavePdf() {
    setPdfBusy(true);
    setPdfError(null);
    try {
      downloadProfilePdf(result!, attribution);
    } catch {
      setPdfError("PDF konnte nicht erzeugt werden. Versuch es noch einmal.");
    } finally {
      setPdfBusy(false);
    }
  }

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
            className="glass-chip min-h-11 text-[var(--neon-cyan)] no-print"
          >
            Nochmal
          </button>
        }
      />

      <div className="print-root mx-auto w-full max-w-3xl space-y-5 px-4 py-6 md:space-y-6 md:py-10">
        {confirmRestart ? (
          <div
            className="glass-panel glass-panel-strong space-y-3 p-4 no-print"
            role="alertdialog"
            aria-labelledby="ergebnis-restart-title"
          >
            <h2
              id="ergebnis-restart-title"
              className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]"
            >
              Test neu starten?
            </h2>
            <p className="text-sm text-[var(--muted)]">
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

        <section
          id="zusammenfassung"
          className="glass-panel glass-panel-strong glass-sheen animate-rise space-y-4 p-6 md:p-8"
        >
          <span className={`glass-chip ${chip.className}`}>{chip.text}</span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] md:text-5xl">
            {plain.roleLabel}
          </h1>
          <p className="text-base leading-relaxed text-[var(--muted)] md:text-lg">
            {plain.oneLine}
          </p>
          <p className="text-sm font-medium text-[var(--neon-mint)]">
            {coverageChip}
          </p>
          {confidenceNote ? (
            <p className="text-sm text-[var(--muted)]">{confidenceNote}</p>
          ) : null}

          <div className="flex flex-wrap gap-2 no-print">
            <button
              type="button"
              onClick={onSavePdf}
              disabled={pdfBusy}
              className="glass-btn glass-btn-primary min-h-11 px-5 text-sm"
            >
              {pdfBusy ? "PDF wird gebaut…" : "PDF speichern"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="glass-btn glass-btn-secondary min-h-11 px-5 text-sm"
            >
              Drucken
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="glass-btn glass-btn-secondary min-h-11 px-5 text-sm"
            >
              {copied ? "Kopiert" : "Kurzfassung kopieren"}
            </button>
          </div>
          {pdfError ? (
            <p className="text-sm text-[var(--neon-coral)] no-print">{pdfError}</p>
          ) : null}
        </section>

        <section id="so-arbeitest-du" className="glass-panel space-y-3 p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] md:text-2xl">
            1. So arbeitest du
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-[var(--muted)] md:text-base">
            {plain.howYouWork.map((line) => (
              <li key={line} className="rounded-xl bg-white/5 px-3 py-2">
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section id="was-dich-anzieht" className="glass-panel space-y-3 p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] md:text-2xl">
            2. Was dich anzieht
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-[var(--muted)] md:text-base">
            {plain.attractiveFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
          {jobFields.length ? (
            <div className="space-y-2 pt-2">
              <p className="text-sm text-[var(--muted)]">Beispiele:</p>
              {jobFields.map((job) => (
                <div key={job.id} className="rounded-xl bg-white/5 px-3 py-2">
                  <div className="font-semibold text-[var(--ink)]">
                    {job.titleDe}
                  </div>
                  <p className="text-sm text-[var(--muted)]">{job.why}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section id="tipps" className="glass-panel space-y-3 p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] md:text-2xl">
            3. Worauf du achten kannst
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-[var(--muted)] md:text-base">
            {plain.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p className="text-xs text-[var(--muted)]">
            Das ist eine Orientierung — keine Diagnose und kein Eignungstest.
          </p>
        </section>

        {result.howBullets.length > 0 ? (
          <section className="space-y-3 no-print">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  Mehr aus dem Profil
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Zusätzliche Stichpunkte — optional.
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
            {howOpen
              ? result.howBullets.map((block) => (
                  <div
                    key={block.title}
                    className="glass-panel space-y-2 p-4 md:p-5"
                  >
                    <h3 className="font-semibold text-[var(--ink)]">
                      {block.title}
                    </h3>
                    <ul className="space-y-2 text-sm leading-relaxed text-[var(--muted)] md:text-base">
                      {block.bullets.map((b) => (
                        <li key={b} className="rounded-xl bg-white/5 px-3 py-2">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              : null}
            {howOpen && result.blendBullets.length ? (
              <div className="glass-panel space-y-2 border border-[var(--neon-coral)]/25 p-4 md:p-5">
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
        ) : null}

        {(result.exclusions?.length ?? 0) > 0 ? (
          <section className="glass-panel space-y-2 p-4 md:p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
              Was wir nicht messen
            </h2>
            <ul className="grid gap-1 text-sm text-[var(--muted)] sm:grid-cols-2">
              {result.exclusions!.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <details
          id="details"
          className="glass-panel p-4 md:p-5 no-print"
          open={detailsOpen}
          onToggle={(e) =>
            setDetailsOpen((e.target as HTMLDetailsElement).open)
          }
        >
          <summary className="cursor-pointer font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
            Details (Codes & Diagramme)
          </summary>
          <div className="mt-4 space-y-5">
            <p className="text-sm text-[var(--muted)]">
              Mustercode {result.primaryCode}
              {result.riasecCode ? ` · Interessenkürzel ${result.riasecCode}` : ""}
              {" · "}
              Beantwortet {result.answeredCount}/{result.itemCount}
            </p>

            <div className="space-y-3">
              <h3 className="font-semibold text-[var(--ink)]">Richtungen</h3>
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

            {result.zwischenLabels.length > 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Gemischt: {result.zwischenLabels.join(" · ")}
              </p>
            ) : null}

            <div className="space-y-2">
              <h3 className="font-semibold text-[var(--ink)]">Ähnliche Muster</h3>
              {result.clusters.map((cluster) => (
                <div
                  key={cluster.code}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2"
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

            <div className="space-y-2">
              <h3 className="font-semibold text-[var(--ink)]">Interessen-Balken</h3>
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
          </div>
        </details>
      </div>
    </main>
  );
}
