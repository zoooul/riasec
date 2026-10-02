"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Group, Modal, Progress, Text, UnstyledButton } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
      <div className="page-shell flex flex-1 items-center justify-center text-center text-[var(--muted)]">
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
    <div className="assessment-flow page-shell page-shell-wide split-lg mx-auto min-h-0 w-full flex-1 overflow-hidden px-3 pb-[max(0.5rem,var(--safe-bottom))] pt-[clamp(0.25rem,0.8vh,0.6rem)] sm:px-4 lg:px-6">
      <div className="assessment-rail">
        <div className="glass-panel shrink-0 space-y-[clamp(0.3rem,0.8vh,0.55rem)] p-[clamp(0.5rem,1.1vh,0.85rem)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
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
          <Progress
            className="glass-progress"
            value={progressVisual}
            aria-label={`Reise: Aufgabe ${progress.questionNumber} von ${progress.itemCount}, ${progress.overallPercent} Prozent`}
            color="cyan"
          />
          <Group
            justify="space-between"
            gap="xs"
            className="assessment-stage-meta text-[0.65rem] text-[var(--muted)] sm:text-[0.7rem]"
            wrap="nowrap"
          >
            <Group gap="md" wrap="wrap">
              <span className="assessment-stage-count">
                Station: {progress.stageAnswered}/{progress.stage.count}
              </span>
              {index > 0 ? (
                <UnstyledButton
                  type="button"
                  className="inline-flex min-h-11 items-center text-[var(--muted-strong)] underline-offset-2 hover:underline disabled:opacity-50"
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    setFlow({ answers, index: Math.max(0, index - 1) });
                  }}
                >
                  Zurück
                </UnstyledButton>
              ) : null}
            </Group>
            {partial ? (
              <UnstyledButton
                type="button"
                className="inline-flex min-h-11 items-center gap-1.5 text-[var(--neon-coral)] underline-offset-2 hover:underline"
                onClick={() => setConfirmRestart(true)}
              >
                <IconRefresh size={14} aria-hidden />
                Neu starten
              </UnstyledButton>
            ) : null}
          </Group>
        </div>

        <Modal
          opened={confirmRestart}
          onClose={() => setConfirmRestart(false)}
          title="Test neu starten?"
          classNames={{
            content: "glass-panel glass-panel-strong",
            header: "bg-transparent",
            title: "text-display text-xl text-[var(--ink)]",
            body: "space-y-4",
          }}
        >
          <Text size="sm" c="dimmed">
            Dein gespeicherter Fortschritt wird gelöscht.
          </Text>
          <Group gap="sm" mt="md">
            <Button type="button" variant="secondary" size="sm" onClick={restart}>
              Ja, neu starten
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmRestart(false)}
            >
              Abbrechen
            </Button>
          </Group>
        </Modal>

        <div className="relative min-h-0 shrink-0 lg:flex-1 lg:overflow-hidden">
          <AnimatePresence>
            {showResumeHint ? (
              <motion.div
                key="resume-hint"
                initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 -top-1 z-10 mx-auto w-fit"
                aria-live="polite"
              >
                <Chip className="text-[var(--neon-cyan)] shadow-lg">
                  Weiter bei Aufgabe {progress.questionNumber}
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
                className="pointer-events-none absolute inset-x-0 -top-1 z-10 mx-auto w-fit"
                aria-live="polite"
              >
                <Chip className="text-[var(--neon-mint)] shadow-lg">
                  Nächste Station: {MODULE_LABELS[stageFlash]}
                </Chip>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-[clamp(0.2rem,0.6vh,0.45rem)] text-center lg:text-left"
            >
              {stageIntro ? (
                <p className="assessment-stage-intro mx-auto max-w-md text-[clamp(0.7rem,1.5vh,0.875rem)] leading-snug text-[var(--muted)] lg:mx-0">
                  {stageIntro}
                </p>
              ) : null}
              {item.task?.title ? (
                <p className="assessment-task-title meta-label mx-auto w-fit normal-case tracking-[0.06em] text-[var(--neon-mint)] lg:mx-0">
                  {item.task.title}
                </p>
              ) : null}
              <h1 className="display-title text-[clamp(1.1rem,3.2vh,2rem)] text-[var(--ink)] lg:text-[clamp(1.35rem,2.8vh,2.15rem)]">
                {item.prompt}
              </h1>
              {item.helpText ? (
                <p className="assessment-help mx-auto max-w-xl text-[clamp(0.7rem,1.4vh,0.9rem)] leading-snug text-[var(--muted)] lg:mx-0">
                  {item.helpText}
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div
        className={cn(
          "assessment-choice-grid grid min-h-0 flex-1 gap-[clamp(0.3rem,0.9vh,0.7rem)] overflow-hidden",
          "grid-cols-2",
        )}
        role="group"
        aria-label="Zwei Lösungspfade"
      >
        {item.choices.map((choice, i) => {
          const isSelected =
            selectedId === choice.id || answers[item.id] === choice.id;
          const pathLabel = i === 0 ? "Weg A" : "Weg B";
          return (
            <motion.button
              key={`${item.id}-${choice.id}`}
              type="button"
              onClick={() => choose(choice.id)}
              disabled={locked && !isSelected}
              aria-pressed={isSelected}
              aria-label={`${pathLabel}: ${choice.label}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : 0.04 + i * 0.05,
                duration: 0.28,
              }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              className={cn(
                "glass-panel glass-choice assessment-choice solution-card min-h-0 h-full overflow-hidden p-[clamp(0.3rem,0.8vh,0.6rem)]",
                isSelected && "glass-choice-picked glass-choice-pop",
              )}
            >
              <div className="relative z-[1] flex h-full min-h-0 flex-1 flex-col gap-[clamp(0.2rem,0.6vh,0.5rem)]">
                <span className="solution-path-tag">{pathLabel}</span>
                <VisualCard
                  kind={choice.visual.kind}
                  motif={choice.visual.motif}
                  imageUrl={choice.visual.imageUrl}
                  compact
                />
                <div className="mt-auto shrink-0 space-y-0.5 px-0.5">
                  <div className="text-[clamp(0.8rem,1.8vh,1.05rem)] font-medium leading-snug tracking-tight text-[var(--ink)]">
                    {choice.label}
                  </div>
                  <p className="assessment-choice-hint text-[clamp(0.66rem,1.35vh,0.85rem)] leading-snug text-[var(--muted)]">
                    {choice.hint}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
