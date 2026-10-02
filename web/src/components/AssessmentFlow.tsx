"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { IconRefresh } from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  MODULE_INTROS,
  MODULE_LABELS,
  MODULE_ORDER,
  computeProgress,
} from "@/lib/assessmentStructure";
import {
  CHOICE_KEY_HINTS,
  shouldHandleAssessmentShortcut,
} from "@/lib/assessmentShortcuts";
import { cn } from "@/lib/cn";
import {
  clearAnswers,
  getAnswersSnapshot,
  getServerAnswersSnapshot,
  hasPartialProgress,
  resumeIndex,
  saveAnswers,
} from "@/lib/session";
import type { AssessmentItem, ModuleId } from "@/lib/types";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { VisualCard } from "./VisualCard";

type Props = {
  items: AssessmentItem[];
};

type FlowState = {
  answers: Record<string, string>;
  index: number;
};

const CHOICE_LOCK_MS = 420;

function subscribeNoop() {
  return () => {};
}

export function AssessmentFlow({ items }: Props) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const stored = useSyncExternalStore(
    subscribeNoop,
    getAnswersSnapshot,
    getServerAnswersSnapshot,
  );
  const [flow, setFlow] = useState<FlowState | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [locked, setLocked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageFlash, setStageFlash] = useState<ModuleId | null>(null);
  const [showResumeHint, setShowResumeHint] = useState(false);
  const prevModuleRef = useRef<ModuleId | null>(null);
  const resumeHintShown = useRef(false);
  const chooseRef = useRef<(choiceId: string) => void>(() => {});

  const active: FlowState =
    flow ??
    (stored
      ? { answers: stored, index: resumeIndex(items, stored) }
      : { answers: {}, index: 0 });

  const ready = stored !== null;
  const { answers, index } = active;
  const item = items[index];

  const progress = useMemo(
    () => computeProgress(items, answers, index),
    [answers, index, items],
  );

  const progressVisual = Math.max(
    progress.overallPercent,
    (progress.questionNumber / Math.max(progress.itemCount, 1)) * 100 * 0.15,
  );

  useEffect(() => {
    if (!ready || resumeHintShown.current) return;
    if (hasPartialProgress(items, answers) && index > 0) {
      setShowResumeHint(true);
      resumeHintShown.current = true;
      const t = window.setTimeout(() => setShowResumeHint(false), 3200);
      return () => window.clearTimeout(t);
    }
  }, [ready, items, answers, index]);

  useEffect(() => {
    if (!item) return;
    if (prevModuleRef.current && prevModuleRef.current !== item.module) {
      setStageFlash(item.module);
      const t = window.setTimeout(() => setStageFlash(null), 1600);
      return () => window.clearTimeout(t);
    }
    prevModuleRef.current = item.module;
  }, [item]);

  function choose(choiceId: string) {
    if (locked || !item) return;
    setLocked(true);
    setSelectedId(choiceId);
    setShowResumeHint(false);

    const nextAnswers = { ...answers, [item.id]: choiceId };
    saveAnswers(nextAnswers);

    window.setTimeout(() => {
      setSelectedId(null);
      setLocked(false);
      if (index >= items.length - 1) {
        setFlow({ answers: nextAnswers, index });
        router.push("/ergebnis");
        return;
      }
      setFlow({ answers: nextAnswers, index: index + 1 });
    }, CHOICE_LOCK_MS);
  }

  function restart() {
    clearAnswers();
    setFlow({ answers: {}, index: 0 });
    setConfirmRestart(false);
    setSelectedId(null);
    setLocked(false);
    setShowResumeHint(false);
    resumeHintShown.current = false;
    prevModuleRef.current = null;
  }

  chooseRef.current = choose;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const choiceIndex = shouldHandleAssessmentShortcut({
        key: event.key,
        target: event.target,
        locked,
        modalOpen: confirmRestart,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
      });
      if (choiceIndex === null || !item) return;
      const choice = item.choices[choiceIndex];
      if (!choice) return;
      event.preventDefault();
      chooseRef.current(choice.id);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmRestart, item, locked]);

  if (!ready || !item) {
    return (
      <div className="page-shell flex flex-1 items-center justify-center text-center text-base-content/60">
        Wird geladen…
      </div>
    );
  }

  const partial = hasPartialProgress(items, answers);
  const stageIntro =
    stageFlash || index === progress.stage.startIndex
      ? MODULE_INTROS[item.module]
      : null;
  const showStatusStrip = showResumeHint || Boolean(stageFlash);
  const currentModuleIdx = MODULE_ORDER.indexOf(item.module);

  return (
    <div className="assessment-flow page-shell page-shell-wide mx-auto min-h-0 min-w-0 w-full flex-1 overflow-hidden px-3 pb-[max(0.35rem,var(--safe-bottom))] pt-1.5 sm:px-4 sm:pt-2 lg:flex lg:flex-row lg:gap-6 lg:px-6">
      <div className="assessment-rail min-w-0 lg:flex lg:flex-col lg:gap-4">
        <div className="assessment-meta-card card bg-base-100 border border-base-300 shadow-sm shrink-0">
          <div className="card-body">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <Chip aria-live="polite">{MODULE_LABELS[item.module]}</Chip>
                <span className="meta-label normal-case tracking-[0.04em] text-base-content/60">
                  Teil {progress.stageIndex + 1}/{progress.stageCount}
                </span>
              </div>
              <span
                className="meta-label shrink-0 pt-0.5 normal-case tracking-[0.04em]"
                aria-live="polite"
              >
                {progress.questionNumber}/{progress.itemCount}
                {progress.answeredCount > 0
                  ? ` · ${progress.overallPercent}%`
                  : ""}
              </span>
            </div>

            <ul className="assessment-steps steps steps-horizontal w-full overflow-hidden text-[0.55rem] sm:text-[0.65rem]">
              {MODULE_ORDER.map((mod, i) => (
                <li
                  key={mod}
                  className={cn(
                    "step",
                    i <= currentModuleIdx && "step-primary",
                  )}
                  data-content={i < currentModuleIdx ? "✓" : undefined}
                >
                  <span className="hidden sm:inline">{MODULE_LABELS[mod]}</span>
                </li>
              ))}
            </ul>

            <progress
              className="progress progress-primary assessment-progress w-full"
              value={progressVisual}
              max={100}
              aria-label={`Reise: Aufgabe ${progress.questionNumber} von ${progress.itemCount}, ${progress.overallPercent} Prozent`}
            />

            <p
              className="assessment-key-hint text-center text-[0.65rem] text-base-content/55 sm:text-left sm:text-[0.7rem] sm:text-base-content/45"
              data-testid="assessment-key-hint"
            >
              <span className="sm:hidden">Taste 1 oder 2</span>
              <span className="hidden sm:inline">Tipp: 1 · 2</span>
            </p>

            <div className="assessment-stage-meta flex flex-wrap items-center justify-between gap-2 text-[0.65rem] text-base-content/60 sm:text-[0.7rem]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="assessment-stage-count">
                  Station: {progress.stageAnswered}/{progress.stage.count}
                </span>
                {index > 0 ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs h-9 min-h-9 px-2"
                    disabled={locked}
                    onClick={() => {
                      if (locked) return;
                      setFlow({ answers, index: Math.max(0, index - 1) });
                    }}
                  >
                    Zurück
                  </button>
                ) : null}
              </div>
              {partial ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs h-9 min-h-9 gap-1.5 px-2 text-accent"
                  onClick={() => setConfirmRestart(true)}
                >
                  <IconRefresh size={14} aria-hidden />
                  Neu starten
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={confirmRestart}
          onClose={() => setConfirmRestart(false)}
          title="Test neu starten?"
          confirmLabel="Ja, neu starten"
          cancelLabel="Abbrechen"
          onConfirm={restart}
        >
          Dein gespeicherter Fortschritt wird gelöscht.
        </ConfirmDialog>

        <div className="assessment-prompt min-h-0 min-w-0 shrink stack-sm">
          <div
            className={cn(
              "assessment-status-strip flex flex-wrap items-center justify-center gap-2 lg:justify-start",
              showStatusStrip && "mb-1",
            )}
            aria-live="polite"
          >
            <AnimatePresence>
              {showResumeHint ? (
                <motion.div
                  key="resume-hint"
                  initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-fit max-w-full"
                >
                  <div
                    role="status"
                    className="alert alert-info alert-soft py-1.5 text-sm"
                  >
                    Weiter bei Aufgabe {progress.questionNumber}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <AnimatePresence>
              {stageFlash ? (
                <motion.div
                  key={stageFlash}
                  initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-fit max-w-full"
                >
                  <div
                    role="status"
                    className="alert alert-success alert-soft py-1.5 text-sm"
                  >
                    Nächste Station: {MODULE_LABELS[stageFlash]}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="stack-sm text-center lg:text-left"
            >
              {stageIntro ? (
                <p className="assessment-stage-intro mx-auto max-w-md text-sm leading-snug text-base-content/60 lg:mx-0">
                  {stageIntro}
                </p>
              ) : null}
              {item.task?.title ? (
                <p className="assessment-task-title meta-label mx-auto w-fit normal-case tracking-[0.06em] lg:mx-0">
                  {item.task.title}
                </p>
              ) : null}
              <h1 className="display-title text-[clamp(1.15rem,2.6vh,1.85rem)] text-base-content lg:text-[clamp(1.35rem,2.4vh,2rem)]">
                {item.prompt}
              </h1>
              {item.helpText ? (
                <p className="assessment-help mx-auto max-w-xl text-sm leading-snug text-base-content/60 lg:mx-0">
                  {item.helpText}
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div
        className="assessment-choice-grid grid min-h-0 min-w-0 grid-cols-2 items-stretch gap-2 overflow-hidden sm:gap-3 lg:min-h-0 lg:flex-1 lg:gap-4"
        role="group"
        aria-label="Zwei Lösungspfade"
      >
        {item.choices.map((choice, i) => {
          const isSelected =
            selectedId === choice.id || answers[item.id] === choice.id;
          const pathLabel = i === 0 ? "Weg A" : "Weg B";
          const keyHint = CHOICE_KEY_HINTS[i] ?? CHOICE_KEY_HINTS[0];
          return (
            <motion.button
              key={`${item.id}-${choice.id}`}
              type="button"
              onClick={() => choose(choice.id)}
              disabled={locked && !isSelected}
              aria-pressed={isSelected}
              aria-label={`${pathLabel}: ${choice.label}`}
              aria-keyshortcuts={keyHint.aria}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : 0.04 + i * 0.05,
                duration: 0.28,
              }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              className={cn(
                "card bg-base-100 border border-base-300 shadow-sm assessment-choice solution-card h-full min-h-0 overflow-hidden text-left",
                isSelected && "solution-card-picked",
              )}
            >
              <figure className="assessment-choice-figure shrink-0 px-1.5 pt-1.5 sm:px-2.5 sm:pt-2.5">
                <VisualCard
                  kind={choice.visual.kind}
                  motif={choice.visual.motif}
                  imageUrl={choice.visual.imageUrl}
                  compact
                />
              </figure>
              <div className="card-body min-w-0 flex-1 gap-1 p-2 pt-1.5 sm:gap-1.5 sm:p-3 sm:pt-2">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="solution-path-tag">{pathLabel}</span>
                  <span
                    className="assessment-choice-keys inline-flex gap-0.5 opacity-90 sm:opacity-55"
                    aria-hidden
                  >
                    <kbd className="kbd kbd-xs">{keyHint.number}</kbd>
                    <kbd className="kbd kbd-xs">{keyHint.letter}</kbd>
                  </span>
                </div>
                <div className="text-[clamp(0.85rem,1.7vh,1.05rem)] font-medium leading-snug tracking-tight text-base-content">
                  {choice.label}
                </div>
                <p className="assessment-choice-hint text-[clamp(0.7rem,1.3vh,0.875rem)] leading-snug text-base-content/60">
                  {choice.hint}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
