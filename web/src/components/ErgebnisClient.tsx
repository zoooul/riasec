"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import * as Progress from "@radix-ui/react-progress";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Copy, FileDown, Printer, RotateCcw } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { RIASEC_IDS, RIASEC_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { OccupationSeed } from "@/lib/occupations";
import { downloadProfilePdf } from "@/lib/profilePdf";
import { scoreAssessment } from "@/lib/scoring";
import {
  clearAnswers,
  getAnswersSnapshot,
  getServerAnswersSnapshot,
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
    subscribeNoop,
    getAnswersSnapshot,
    getServerAnswersSnapshot,
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
          <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
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
          <span className="glass-chip text-[var(--neon-coral)]">
            Nur Orientierung
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
            Noch nicht fertig
          </h1>
          <p className="text-[var(--muted)]">
            {result.coverageHint}. Mach weiter, damit das Ergebnis stabiler
            wird. Bis dahin ist alles nur eine grobe Orientierung.
          </p>
          <Link
            href="/assessment"
            className="glass-btn glass-btn-primary min-h-11 w-full max-w-xs"
          >
            Weiter im Test
          </Link>
          <Dialog.Root open={confirmRestart} onOpenChange={setConfirmRestart}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm text-[var(--neon-coral)] underline-offset-2 hover:underline"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Neu starten
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm" />
              <Dialog.Content className="glass-panel glass-panel-strong fixed left-1/2 top-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 space-y-4 p-5 text-left outline-none">
                <Dialog.Title className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  Antworten wirklich löschen?
                </Dialog.Title>
                <Dialog.Description className="text-sm text-[var(--muted)]">
                  Dein Zwischenspeicher wird geleert.
                </Dialog.Description>
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
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="glass-btn glass-btn-secondary min-h-11 px-4 text-sm"
                    >
                      Abbrechen
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          {(result.exclusions?.length ?? 0) > 0 ? (
            <div className="glass-panel w-full space-y-2 p-4 text-left">
              <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--ink)]">
                Was wir nicht messen
              </h2>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                {result.exclusions!.slice(0, 4).map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
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
          <Dialog.Root open={confirmRestart} onOpenChange={setConfirmRestart}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="glass-chip min-h-11 gap-1.5 text-[var(--neon-cyan)] no-print"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Nochmal
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm no-print" />
              <Dialog.Content className="glass-panel glass-panel-strong fixed left-1/2 top-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 space-y-4 p-5 outline-none no-print">
                <Dialog.Title className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  Test neu starten?
                </Dialog.Title>
                <Dialog.Description className="text-sm text-[var(--muted)]">
                  Dein aktuelles Ergebnis wird aus dem Zwischenspeicher gelöscht.
                </Dialog.Description>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/assessment"
                    className="glass-btn glass-btn-primary min-h-11 px-5 text-sm"
                    onClick={() => clearAnswers()}
                  >
                    Ja, neu starten
                  </Link>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="glass-btn glass-btn-secondary min-h-11 px-5 text-sm"
                    >
                      Behalten
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        }
      />

      <motion.div
        className="print-root mx-auto w-full max-w-3xl space-y-5 px-4 py-6 md:space-y-6 md:py-10"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <section
          id="zusammenfassung"
          className="glass-panel glass-panel-strong glass-sheen space-y-4 p-6 md:p-8"
        >
          <span className={cn("glass-chip", chip.className)}>{chip.text}</span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] md:text-5xl">
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
              className="glass-btn glass-btn-primary inline-flex min-h-11 items-center gap-2 px-5 text-sm"
            >
              <FileDown className="size-4" aria-hidden />
              {pdfBusy ? "PDF wird gebaut…" : "PDF speichern"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="glass-btn glass-btn-secondary inline-flex min-h-11 items-center gap-2 px-5 text-sm"
            >
              <Printer className="size-4" aria-hidden />
              Drucken
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="glass-btn glass-btn-secondary inline-flex min-h-11 items-center gap-2 px-5 text-sm"
            >
              <Copy className="size-4" aria-hidden />
              {copied ? "Kopiert" : "Kurzfassung kopieren"}
            </button>
          </div>
          {pdfError ? (
            <p className="text-sm text-[var(--neon-coral)] no-print">{pdfError}</p>
          ) : null}
        </section>

        <section id="so-arbeitest-du" className="glass-panel space-y-3 p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] md:text-2xl">
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
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] md:text-2xl">
            2. Was dich anzieht
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-[var(--muted)] md:text-base">
            {plain.attractiveFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
          {jobFields.length ? (
            <div className="space-y-2 pt-2">
              <p className="text-sm text-[var(--muted)]">
                {result.qualityLabel === "orientierung"
                  ? "Erste Berufsideen (nur Orientierung):"
                  : result.qualityLabel === "unsicher"
                    ? "Berufsideen — eher vorsichtig lesen:"
                    : "Beispiele:"}
              </p>
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
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] md:text-2xl">
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
          <Collapsible.Root
            open={howOpen}
            onOpenChange={setHowOpen}
            className="space-y-3 no-print"
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
                  Mehr aus dem Profil
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Zusätzliche Stichpunkte — optional.
                </p>
              </div>
              <Collapsible.Trigger asChild>
                <button
                  type="button"
                  className="glass-chip inline-flex min-h-11 items-center gap-1.5 text-[var(--neon-cyan)]"
                >
                  {howOpen ? "Weniger" : "Mehr lesen"}
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      howOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
              </Collapsible.Trigger>
            </div>
            <Collapsible.Content className="space-y-3 data-[state=open]:animate-rise">
              {result.howBullets.map((block) => (
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
              ))}
              {result.blendBullets.length ? (
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
            </Collapsible.Content>
          </Collapsible.Root>
        ) : null}

        {(result.exclusions?.length ?? 0) > 0 ? (
          <section className="glass-panel space-y-2 p-4 md:p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
              Was wir nicht messen
            </h2>
            <ul className="grid gap-1 text-sm text-[var(--muted)] sm:grid-cols-2">
              {result.exclusions!.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <Collapsible.Root
          id="details"
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          className="glass-panel p-4 md:p-5 no-print"
        >
          <Collapsible.Trigger asChild>
            <button
              type="button"
              className="flex w-full min-h-11 items-center justify-between gap-3 text-left font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]"
            >
              Details (Codes & Diagramme)
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-[var(--muted)] transition-transform duration-200",
                  detailsOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </Collapsible.Trigger>
          <AnimatePresence initial={false}>
            {detailsOpen ? (
              <Collapsible.Content forceMount asChild>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-5">
                    <p className="text-sm text-[var(--muted)]">
                      Mustercode {result.primaryCode}
                      {result.riasecCode
                        ? ` · Interessenkürzel ${result.riasecCode}`
                        : ""}
                      {" · "}
                      Beantwortet {result.answeredCount}/{result.itemCount}
                    </p>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-[var(--ink)]">
                        Richtungen
                      </h3>
                      {result.axes.map((axis) => {
                        const pct = (axis.value + 100) / 2;
                        return (
                          <div key={axis.id} className="space-y-1.5">
                            <div className="flex justify-between gap-2 text-xs text-[var(--muted)] md:text-sm">
                              <span>{axis.poleLow}</span>
                              <span>{axis.poleHigh}</span>
                            </div>
                            <Progress.Root
                              className="glass-progress"
                              value={pct}
                              max={100}
                            >
                              <Progress.Indicator
                                className="block h-full rounded-[inherit]"
                                style={{
                                  width: `${Math.max(8, Math.min(100, pct))}%`,
                                  background:
                                    "linear-gradient(90deg, #39f3ff, #7dffb2, #ff6b9d)",
                                }}
                              />
                            </Progress.Root>
                            <p className="text-sm text-[var(--ink)]">
                              {axis.plain}
                            </p>
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
                      <h3 className="font-semibold text-[var(--ink)]">
                        Ähnliche Muster
                      </h3>
                      {result.clusters.map((cluster) => (
                        <div
                          key={cluster.code}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2"
                        >
                          <div>
                            <div className="font-semibold text-[var(--ink)]">
                              {cluster.role}{" "}
                              <span className="text-[var(--muted)]">
                                ({cluster.code})
                              </span>
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
                      <h3 className="font-semibold text-[var(--ink)]">
                        Interessen-Balken
                      </h3>
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
                            <Progress.Root
                              className="glass-progress"
                              value={width}
                              max={100}
                            >
                              <Progress.Indicator
                                className="block h-full rounded-[inherit]"
                                style={{
                                  width: `${Math.max(value > 0 ? 8 : 0, width)}%`,
                                  background:
                                    "linear-gradient(90deg, #39f3ff, #7dffb2)",
                                }}
                              />
                            </Progress.Root>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </Collapsible.Content>
            ) : null}
          </AnimatePresence>
        </Collapsible.Root>
      </motion.div>
    </main>
  );
}
