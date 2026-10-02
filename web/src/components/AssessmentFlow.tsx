"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { MODULE_LABELS } from "@/lib/constants";
import {
  clearAnswers,
  hasPartialProgress,
  loadAnswers,
  resumeIndex,
  saveAnswers,
} from "@/lib/session";
import type { AssessmentItem } from "@/lib/types";
import { VisualCard } from "./VisualCard";

type Props = {
  items: AssessmentItem[];
};

type FlowState = {
  answers: Record<string, string>;
  index: number;
};

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

  // Derive initial client state from session once hydrated.
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

  if (!ready || !item) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-[var(--muted)]">
        Wird geladen…
      </div>
    );
  }

  const partial = hasPartialProgress(items, answers);

  function choose(choiceId: string) {
    const nextAnswers = { ...answers, [item.id]: choiceId };
    saveAnswers(nextAnswers);

    if (index >= items.length - 1) {
      setFlow({ answers: nextAnswers, index });
      router.push("/ergebnis");
      return;
    }
    setFlow({ answers: nextAnswers, index: index + 1 });
  }

  function restart() {
    clearAnswers();
    setFlow({ answers: {}, index: 0 });
    setConfirmRestart(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 pb-[max(1.5rem,var(--safe-bottom))] md:gap-8 md:py-10">
      <div className="glass-panel space-y-3 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <span className="glass-chip">{MODULE_LABELS[item.module]}</span>
          <span>
            {index + 1}/{items.length}
            {answeredN > 0 ? ` · ${progress}%` : ""}
          </span>
        </div>
        <div className="glass-progress" aria-hidden>
          <span
            style={{
              width: `${Math.max(progress, ((index + 1) / items.length) * 100)}%`,
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
          const selected = answers[item.id] === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => choose(choice.id)}
              className={`glass-panel glass-choice glass-sheen p-3 sm:p-4 ${
                selected ? "ring-2 ring-[var(--neon-cyan)]/70" : ""
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
          onClick={() =>
            setFlow({ answers, index: Math.max(0, index - 1) })
          }
          className="glass-btn glass-btn-secondary self-start px-5 py-2 text-sm"
        >
          Zurück
        </button>
      ) : null}
    </div>
  );
}
