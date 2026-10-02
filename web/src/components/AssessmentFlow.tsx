"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as Progress from "@radix-ui/react-progress";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RotateCcw } from "lucide-react";
import {
  MODULE_INTROS,
  MODULE_LABELS,
  computeProgress,
} from "@/lib/assessmentStructure";
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
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
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

  if (!ready || !item) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-[var(--muted)]">
        Wird geladen…
      </div>
    );
  }

  const partial = hasPartialProgress(items, answers);
  const stageIntro =
    stageFlash || index === progress.stage.startIndex
      ? MODULE_INTROS[item.module]
      : null;

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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 overflow-x-hidden px-4 py-5 pb-[max(1.5rem,var(--safe-bottom))] md:gap-7 md:py-10">
      <div className="glass-panel sticky top-[calc(4.25rem+var(--safe-top))] z-10 space-y-3 p-3.5 md:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Chip aria-live="polite">{MODULE_LABELS[item.module]}</Chip>
            <span className="meta-label normal-case tracking-[0.04em] text-[var(--muted)]">
              Teil {progress.stageIndex + 1}/{progress.stageCount}
            </span>
          </div>
          <span
            className="meta-label shrink-0 normal-case tracking-[0.04em]"
            aria-live="polite"
          >
            {progress.questionNumber}/{progress.itemCount}
            {progress.answeredCount > 0
              ? ` · ${progress.overallPercent}%`
              : ""}
          </span>
        </div>
        <Progress.Root
          className="glass-progress"
          value={progress.overallPercent}
          max={100}
          aria-label={`Fortschritt: Frage ${progress.questionNumber} von ${progress.itemCount}, ${progress.overallPercent} Prozent`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.overallPercent}
        >
          <Progress.Indicator
            className="block h-full rounded-[inherit] bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-mint)] transition-[width] duration-450 ease-out"
            style={{ width: `${progressVisual}%` }}
          />
        </Progress.Root>
        <div className="flex items-center justify-between gap-2 text-[0.7rem] text-[var(--muted)]">
          <span>
            In diesem Teil: {progress.stageAnswered}/{progress.stage.count}
          </span>
          {partial ? (
            <Dialog.Root open={confirmRestart} onOpenChange={setConfirmRestart}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-1.5 text-[var(--neon-coral)] underline-offset-2 hover:underline"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Neu starten
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm" />
                <Dialog.Content className="glass-panel glass-panel-strong fixed left-1/2 top-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 space-y-4 p-5 outline-none">
                  <Dialog.Title className="text-display text-xl text-[var(--ink)]">
                    Test neu starten?
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-[var(--muted)]">
                    Dein gespeicherter Fortschritt wird gelöscht.
                  </Dialog.Description>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={restart}>
                      Ja, neu starten
                    </Button>
                    <Dialog.Close asChild>
                      <Button type="button" variant="secondary" size="sm">
                        Abbrechen
                      </Button>
                    </Dialog.Close>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {showResumeHint ? (
          <motion.div
            key="resume-hint"
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto w-fit"
            aria-live="polite"
          >
            <Chip className="text-[var(--neon-cyan)]">
              Weiter von Frage {progress.questionNumber}
            </Chip>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {stageFlash ? (
          <motion.div
            key={stageFlash}
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto w-fit"
            aria-live="polite"
          >
            <Chip className="text-[var(--neon-mint)]">
              Neuer Teil: {MODULE_LABELS[stageFlash]}
            </Chip>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3 text-center"
        >
          {stageIntro ? (
            <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--muted)]">
              {stageIntro}
            </p>
          ) : null}
          <h1 className="display-title text-2xl text-[var(--ink)] sm:text-3xl md:text-[2.15rem]">
            {item.prompt}
          </h1>
          {item.helpText ? (
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
              {item.helpText}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div
        className={cn(
          "grid gap-3 sm:gap-4",
          item.choices.length <= 2
            ? "md:grid-cols-2"
            : "sm:grid-cols-2 md:grid-cols-2",
        )}
        role="group"
        aria-label="Antwortmöglichkeiten"
      >
        {item.choices.map((choice, i) => {
          const isSelected =
            selectedId === choice.id || answers[item.id] === choice.id;
          return (
            <motion.button
              key={`${item.id}-${choice.id}`}
              type="button"
              onClick={() => choose(choice.id)}
              disabled={locked && !isSelected}
              aria-pressed={isSelected}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : 0.04 + i * 0.05,
                duration: 0.28,
              }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              className={cn(
                "glass-panel glass-choice h-full min-h-[12.5rem] p-2.5 sm:min-h-[14rem] sm:p-3",
                isSelected && "glass-choice-picked glass-choice-pop",
              )}
            >
              <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
                <VisualCard
                  kind={choice.visual.kind}
                  motif={choice.visual.motif}
                  imageUrl={choice.visual.imageUrl}
                />
                <div className="mt-auto space-y-1 px-0.5 pt-2.5 sm:pt-3">
                  <div className="text-[0.98rem] font-semibold leading-snug tracking-tight text-[var(--ink)] sm:text-lg">
                    {choice.label}
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">
                    {choice.hint}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {index > 0 ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="self-start"
          disabled={locked}
          onClick={() => {
            if (locked) return;
            setFlow({ answers, index: Math.max(0, index - 1) });
          }}
        >
          Zurück
        </Button>
      ) : null}
    </div>
  );
}
