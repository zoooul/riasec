"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { MODULE_LABELS } from "@/lib/constants";
import {
  clearAnswers,
  hasPartialProgress,
  loadAnswers,
  resumeIndex,
  saveAnswers,
} from "@/lib/session";
import type { AssessmentItem, ModuleId } from "@/lib/types";
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

function getServerAnswers(): Record<string, string> | null {
  return null;
}

export function AssessmentFlow({ items }: Props) {
  const router = useRouter();
  const stored = useSyncExternalStore(
    subscribeNoop,
    loadAnswers,
    getServerAnswers,
  );
  const [flow, setFlow] = useState<FlowState | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [locked, setLocked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moduleFlash, setModuleFlash] = useState<ModuleId | null>(null);
  const prevModuleRef = useRef<ModuleId | null>(null);

  const active: FlowState =
    flow ??
    (stored
      ? { answers: stored, index: resumeIndex(items, stored) }
      : { answers: {}, index: 0 });

  const ready = stored !== null;
  const { answers, index } = active;
  const item = items[index];

  const answeredN = useMemo(
    () => items.filter((it) => Boolean(answers[it.id])).length,
    [answers, items],
  );
  const progress = useMemo(() => {
    if (!items.length) return 0;
    return Math.round((answeredN / items.length) * 100);
  }, [answeredN, items.length]);

  useEffect(() => {
    if (!item) return;
    if (prevModuleRef.current && prevModuleRef.current !== item.module) {
      setModuleFlash(item.module);
      const t = window.setTimeout(() => setModuleFlash(null), 1400);
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

  function choose(choiceId: string) {
    if (locked || !item) return;
    setLocked(true);
    setSelectedId(choiceId);

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
    prevModuleRef.current = null;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 overflow-x-hidden px-4 py-6 pb-[max(1.5rem,var(--safe-bottom))] md:gap-8 md:py-10">
      <div className="glass-panel sticky top-[calc(4.25rem+var(--safe-top))] z-10 space-y-3 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <span className="glass-chip" aria-live="polite">
            {MODULE_LABELS[item.module]}
          </span>
          <span>
            {index + 1}/{items.length}
            {answeredN > 0 ? ` · ${progress}%` : ""}
          </span>
        </div>
        <div
          className="glass-progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Fortschritt"
        >
          <span
            style={{
              width: `${Math.max(
                progress,
                ((index + 1) / items.length) * 100 * 0.15,
              )}%`,
            }}
          />
        </div>
        {partial ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span>Fortschritt gespeichert</span>
            {!confirmRestart ? (
              <button
                type="button"
                onClick={() => setConfirmRestart(true)}
                className="text-[var(--neon-coral)] underline-offset-2 hover:underline"
              >
                Neu starten
              </button>
            ) : (
              <span className="flex flex-wrap items-center gap-2">
                Wirklich neu?
                <button
                  type="button"
                  onClick={restart}
                  className="text-[var(--neon-coral)] underline-offset-2 hover:underline"
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRestart(false)}
                  className="underline-offset-2 hover:underline"
                >
                  Abbrechen
                </button>
              </span>
            )}
          </div>
        ) : null}
      </div>

      {moduleFlash ? (
        <div
          className="animate-rise glass-chip mx-auto text-[var(--neon-mint)]"
          aria-live="polite"
        >
          Neuer Teil: {MODULE_LABELS[moduleFlash]}
        </div>
      ) : null}

      <div className="animate-rise space-y-2 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
          {item.prompt}
        </h1>
        {item.helpText ? (
          <p className="text-sm text-[var(--muted)] md:text-base">
            {item.helpText}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {item.choices.map((choice, i) => {
          const isSelected =
            selectedId === choice.id || answers[item.id] === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => choose(choice.id)}
              disabled={locked && !isSelected}
              className={`glass-panel glass-choice glass-sheen p-3 sm:p-4 ${
                isSelected ? "ring-2 ring-[var(--neon-cyan)]/70" : ""
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <VisualCard
                kind={choice.visual.kind}
                motif={choice.visual.motif}
                imageUrl={choice.visual.imageUrl}
              />
              <div className="relative z-[1] mt-3 space-y-1 sm:mt-4">
                <div className="text-base font-semibold text-[var(--ink)] sm:text-lg">
                  {choice.label}
                </div>
                <p className="text-sm leading-relaxed text-[var(--muted)]">
                  {choice.hint}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {index > 0 ? (
        <button
          type="button"
          onClick={() => {
            if (locked) return;
            setFlow({ answers, index: Math.max(0, index - 1) });
          }}
          className="glass-btn glass-btn-secondary self-start px-5 py-2 text-sm"
        >
          Zurück
        </button>
      ) : null}
    </div>
  );
}
