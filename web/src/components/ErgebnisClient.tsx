"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconPrinter,
  IconRefresh,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RIASEC_IDS, RIASEC_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { OccupationSeed } from "@/lib/occupations";
import { downloadProfilePdf } from "@/lib/profilePdf";
import { scoreAssessment } from "@/lib/scoring";
import {
  clearAnswers,
  getAnswersSnapshot,
  getServerAnswersSnapshot,
  subscribeAnswers,
} from "@/lib/session";
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
    return { text: "Nur Orientierung", className: "badge-accent" };
  }
  if (label === "unsicher") {
    return {
      text: "Etwas unsicher",
      className: "badge-secondary",
    };
  }
  return { text: "Dein Ergebnis", className: "badge-primary" };
}

function copySummary(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("clipboard unavailable"));
}

/**
 * Ergebnis scores client-side via `scoreAssessment` (offline, no round-trip).
 * Server mirror: POST /api/score — same pure function for API/tests.
 */
export function ErgebnisClient({
  items,
  profiles,
  occupations,
  attribution = [],
}: Props) {
  const reduceMotion = useReducedMotion();
  const answers = useSyncExternalStore(
    subscribeAnswers,
    getAnswersSnapshot,
    getServerAnswersSnapshot,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const result = useMemo(() => {
    if (!answers) return null;
    return scoreAssessment(items, answers, profiles, occupations);
  }, [answers, items, profiles, occupations]);

  if (answers === null) {
    return (
      <main className="flex flex-1 flex-col">
        <SiteHeader />
        <div className="page-shell py-16 text-center text-base-content/60">
          Ergebnis wird geladen…
        </div>
      </main>
    );
  }

  if (!result || !result.answeredCount) {
    return (
      <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
        <SiteHeader
          right={
            <Chip href="/assessment" className="badge-ghost">
              Zum Test
            </Chip>
          }
        />
        <div className="page-shell flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="display-title text-2xl text-base-content">
            Noch kein Ergebnis
          </h1>
          <p className="max-w-md text-base-content/60">
            Starte den Bild-Test — danach erscheint hier dein Muster. Antworten
            bleiben nur lokal im Browser.
          </p>
          <Button href="/assessment" variant="primary" className="w-full max-w-xs">
            Aufgaben starten
          </Button>
          <Button href="/profile" variant="ghost" size="sm">
            Profile durchstöbern
          </Button>
        </div>
      </main>
    );
  }

  if (result.isIncomplete) {
    return (
      <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
        <SiteHeader
          right={
            <Chip href="/assessment" className="badge-secondary">
              Weiter
            </Chip>
          }
        />
        <div className="page-shell flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Chip className="badge-accent">Nur Orientierung</Chip>
          <h1 className="display-title text-2xl text-base-content">
            Noch nicht fertig
          </h1>
          <p className="max-w-md text-base-content/60">
            {result.coverageHint}. Beantwortet: {result.answeredCount}/
            {result.itemCount}. Mach weiter, damit das Ergebnis stabiler wird.
            Bis dahin ist alles nur eine grobe Orientierung.
          </p>
          <progress
            className="progress progress-primary w-full max-w-xs"
            value={result.answeredCount}
            max={result.itemCount}
            aria-label={`Fortschritt ${result.answeredCount} von ${result.itemCount}`}
          />
          <Button href="/assessment" className="w-full max-w-xs">
            Weiter in den Aufgaben
          </Button>
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-1.5 text-accent"
            onClick={() => setConfirmRestart(true)}
          >
            <IconRefresh size={14} aria-hidden />
            Neu starten
          </button>
          <ConfirmDialog
            open={confirmRestart}
            onClose={() => setConfirmRestart(false)}
            title="Antworten wirklich löschen?"
            confirmLabel="Ja, löschen"
            cancelLabel="Abbrechen"
            onConfirm={() => {
              clearAnswers();
              setConfirmRestart(false);
            }}
          >
            Dein Zwischenspeicher wird geleert.
          </ConfirmDialog>
          {(result.exclusions?.length ?? 0) > 0 ? (
            <div className="card w-full border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body gap-2 p-4 text-left">
                <h2 className="card-title display-title text-base text-base-content">
                  Was wir nicht messen
                </h2>
                <ul className="space-y-1 text-sm text-base-content/60">
                  {result.exclusions!.slice(0, 4).map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
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
    setCopyError(null);
    try {
      await copySummary(summaryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError("Kopieren nicht möglich — Text manuell markieren.");
    }
  }

  return (
    <main className="flex flex-1 flex-col pb-[max(1.5rem,var(--safe-bottom))]">
      <SiteHeader
        right={
          <Chip className="no-print" onClick={() => setConfirmRestart(true)}>
            <IconRefresh size={14} aria-hidden />
            Nochmal
          </Chip>
        }
      />
      <ConfirmDialog
        open={confirmRestart}
        onClose={() => setConfirmRestart(false)}
        title="Test neu starten?"
        confirmLabel="Ja, neu starten"
        cancelLabel="Behalten"
        confirmHref="/assessment"
        onConfirm={() => clearAnswers()}
        className="no-print"
      >
        Dein aktuelles Ergebnis wird aus dem Zwischenspeicher gelöscht.
      </ConfirmDialog>

      <motion.div
        className="print-root page-shell stack-lg py-5 md:py-8"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <section
          id="zusammenfassung"
          className="card bg-base-100 border border-base-300 shadow-sm"
        >
          <div className="card-body gap-4 p-5 md:gap-5 md:p-7">
          <Chip className={cn("badge-soft", chip.className)}>{chip.text}</Chip>
          <h1 className="card-title display-title mb-0 text-3xl text-base-content md:text-[2.75rem]">
            {plain.roleLabel}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-base-content/80 md:text-lg">
            {plain.oneLine}
          </p>
          <p className="meta-label normal-case tracking-[0.03em] text-base-content/60">
            {coverageChip}
          </p>
          {confidenceNote ? (
            <div role="status" className="alert alert-warning alert-soft text-sm">
              {confidenceNote}
            </div>
          ) : null}

          <div className="actions-row flex-wrap gap-2 pt-1 no-print">
            <Button
              type="button"
              size="sm"
              onClick={onSavePdf}
              disabled={pdfBusy}
            >
              <IconDownload size={16} aria-hidden />
              {pdfBusy ? "PDF wird gebaut…" : "PDF speichern"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              <IconPrinter size={16} aria-hidden />
              Drucken
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCopy}
            >
              <IconCopy size={16} aria-hidden />
              {copied ? "Kopiert" : "Kurzfassung kopieren"}
            </Button>
          </div>
          {pdfError ? (
            <div role="alert" className="alert alert-error alert-soft text-sm no-print">
              {pdfError}
            </div>
          ) : null}
          {copyError ? (
            <div role="alert" className="alert alert-warning alert-soft text-sm no-print">
              {copyError}
            </div>
          ) : null}
          </div>
        </section>

        <section id="so-arbeitest-du" className="stack-sm px-1 py-1 md:px-2">
          <h2 className="display-title flex items-center gap-2 text-xl text-base-content md:text-2xl">
            <span className="badge badge-primary badge-sm">1</span>
            So arbeitest du
          </h2>
          <ul className="space-y-2.5 text-sm leading-relaxed text-base-content/80 md:text-base">
            {plain.howYouWork.map((line) => (
              <li key={line} className="border-l border-base-300 pl-3">
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section id="was-dich-anzieht" className="stack-sm px-1 py-1 md:px-2">
          <h2 className="display-title flex items-center gap-2 text-xl text-base-content md:text-2xl">
            <span className="badge badge-primary badge-sm">2</span>
            Was dich anzieht
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-base-content/80 md:text-base">
            {plain.attractiveFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
          {jobFields.length ? (
            <div className="stack-sm pt-2">
              <p className="meta-label normal-case tracking-[0.03em]">
                {result.qualityLabel === "orientierung"
                  ? "Erste Berufsideen (nur Orientierung)"
                  : result.qualityLabel === "unsicher"
                    ? "Berufsideen — eher vorsichtig lesen"
                    : "Beispiele"}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {jobFields.map((job) => (
                  <div
                    key={job.id}
                    className="card bg-base-100 border border-base-300 shadow-sm"
                  >
                    <div className="card-body gap-1.5 p-4">
                      <div className="font-semibold text-base-content">
                        {job.titleDe}
                      </div>
                      <p className="text-sm text-base-content/60">{job.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section id="tipps" className="stack-sm px-1 py-1 md:px-2">
          <h2 className="display-title flex items-center gap-2 text-xl text-base-content md:text-2xl">
            <span className="badge badge-primary badge-sm">3</span>
            Worauf du achten kannst
          </h2>
          <ul className="space-y-2.5 text-sm leading-relaxed text-base-content/80 md:text-base">
            {plain.tips.map((tip) => (
              <li key={tip} className="border-l border-base-300 pl-3">
                {tip}
              </li>
            ))}
          </ul>
          <p className="text-xs text-base-content/60">
            Das ist eine Orientierung — keine Diagnose und kein Eignungstest.
          </p>
        </section>

        {result.howBullets.length > 0 ? (
          <div className="stack-sm no-print">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="display-title text-xl text-base-content">
                  Mehr aus dem Profil
                </h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Zusätzliche Stichpunkte — optional.
                </p>
              </div>
              <Chip onClick={() => setHowOpen((v) => !v)}>
                {howOpen ? "Weniger" : "Mehr lesen"}
                <IconChevronDown
                  size={16}
                  className={cn(
                    "transition-transform duration-200",
                    howOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </Chip>
            </div>
            {howOpen ? (
              <div className="stack-sm animate-rise">
                {result.howBullets.map((block) => (
                  <div
                    key={block.title}
                    className="card bg-base-100 border border-base-300 shadow-sm"
                  >
                    <div className="card-body gap-2 p-4 md:p-5">
                      <h3 className="font-semibold text-base-content">
                        {block.title}
                      </h3>
                      <ul className="space-y-2 text-sm leading-relaxed text-base-content/60 md:text-base">
                        {block.bullets.map((b) => (
                          <li
                            key={b}
                            className="rounded-lg bg-base-200 px-3 py-2"
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
                {result.blendBullets.length ? (
                  <div className="card border border-accent/30 bg-base-100 shadow-sm">
                    <div className="card-body gap-2 p-4 md:p-5">
                      <h3 className="font-semibold text-accent">
                        Auch aus benachbarten Mustern
                      </h3>
                      <ul className="space-y-2 text-sm text-base-content/60 md:text-base">
                        {result.blendBullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {(result.exclusions?.length ?? 0) > 0 ? (
          <section className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body gap-2 p-4 md:p-5">
              <h2 className="display-title text-lg text-base-content">
                Was wir nicht messen
              </h2>
              <ul className="grid gap-1 text-sm text-base-content/60 sm:grid-cols-2">
                {result.exclusions!.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <div
          id="details"
          className="collapse collapse-arrow card bg-base-100 border border-base-300 shadow-sm no-print"
        >
          <input
            type="checkbox"
            checked={detailsOpen}
            onChange={() => setDetailsOpen((v) => !v)}
            aria-label="Details öffnen"
          />
          <div className="collapse-title display-title text-lg text-base-content">
            Details (Codes & Diagramme)
          </div>
          <div className="collapse-content">
            <div className="space-y-5 pt-1">
              <p className="text-sm text-base-content/60">
                Mustercode {result.primaryCode}
                {result.riasecCode
                  ? ` · Interessenkürzel ${result.riasecCode}`
                  : ""}
                {" · "}
                Beantwortet {result.answeredCount}/{result.itemCount}
              </p>

              <div className="space-y-3">
                <h3 className="font-semibold text-base-content">Richtungen</h3>
                {result.axes.map((axis) => {
                  const pct = (axis.value + 100) / 2;
                  return (
                    <div key={axis.id} className="space-y-1.5">
                      <div className="flex justify-between gap-2 text-xs text-base-content/60 md:text-sm">
                        <span>{axis.poleLow}</span>
                        <span>{axis.poleHigh}</span>
                      </div>
                      <progress
                        className="progress progress-primary w-full"
                        value={Math.max(8, Math.min(100, pct))}
                        max={100}
                      />
                      <p className="text-sm text-base-content">{axis.plain}</p>
                    </div>
                  );
                })}
              </div>

              {result.zwischenLabels.length > 0 ? (
                <p className="text-sm text-base-content/60">
                  Gemischt: {result.zwischenLabels.join(" · ")}
                </p>
              ) : null}

              <div className="space-y-2">
                <h3 className="font-semibold text-base-content">
                  Ähnliche Muster
                </h3>
                {result.clusters.map((cluster) => (
                  <div
                    key={cluster.code}
                    className="flex items-center justify-between gap-3 rounded-lg bg-base-200 px-3 py-2"
                  >
                    <div>
                      <div className="font-semibold text-base-content">
                        {cluster.role}{" "}
                        <span className="text-base-content/60">
                          ({cluster.code})
                        </span>
                      </div>
                      {cluster.isZwischen ? (
                        <div className="text-xs text-secondary">
                          Zwischenprofil
                        </div>
                      ) : null}
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {Math.round(cluster.weight * 100)}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-base-content">
                  Interessen-Balken
                </h3>
                {riasecSorted.map((id) => {
                  const value = Math.max(result.riasec[id], 0);
                  const width = Math.round((value / maxRiasec) * 100);
                  return (
                    <div key={id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-base-content">
                          {RIASEC_LABELS[id]}
                        </span>
                        <span className="text-base-content/60">{id}</span>
                      </div>
                      <progress
                        className="progress progress-secondary w-full"
                        value={Math.max(value > 0 ? 8 : 0, width)}
                        max={100}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
