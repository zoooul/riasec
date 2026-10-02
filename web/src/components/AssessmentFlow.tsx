"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const CHOICE_LOCK_MS = 420;

export function AssessmentFlow({ items }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [moduleFlash, setModuleFlash] = useState<ModuleId | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [locked, setLocked] = useState(false);
  const prevModuleRef = useRef<ModuleId | null>(null);

  useEffect(() => {
    const stored = loadAnswers();
    setAnswers(stored);
    setIndex(resumeIndex(items, stored));
    setReady(true);
  }, [items]);

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

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-[var(--muted-strong)]">
        Wird geladen…
      </div>
    );
  }

  if (!item) return null;

  const partial = hasPartialProgress(items, answers);

  function choose(choiceId: string) {
    if (locked || !item) return;
    setLocked(true);
    setSelectedId(choiceId);

    const nextAnswers = { ...answers, [item.id]: choiceId };
    setAnswers(nextAnswers);
    saveAnswers(nextAnswers);

    window.setTimeout(() => {
      setSelectedId(null);
      setLocked(false);
      if (index >= items.length - 1) {
        router.push("/ergebnis");
        return;
      }
      setIndex((i) => i + 1);
    }, CHOICE_LOCK_MS);
  }

  function confirmDoRestart() {
    clearAnswers();
    setAnswers({});
    setIndex(0);
    setConfirmRestart(false);
    setSelectedId(null);
    setLocked(false);
    prevModuleRef.current = null;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 overflow-x-hidden px-4 py-4 pb-[max(1.5rem,var(--safe-bottom))] md:gap-7 md:py-8">
      <div className="glass-panel sticky top-[calc(4.25rem+var(--safe-top))] z-10 space-y-3 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted-strong)]">
          <span className="glass-chip" aria-live="polite">
            {MODULE_LABELS[item.module]}
          </span>
          <span aria-label={`Frage ${index + 1} von ${items.length}`}>
            {index + 1}/{items.length}
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
              width: `${Math.max(progress, ((index + 1) / items.length) * 100 * 0.15)}%`,
            }}
          />
        </div>
        {partial ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-strong)]">
            <span>Zwischenspeicher aktiv — du kannst weitermachen.</span>
            <button
              type="button"
              onClick={() => setConfirmRestart(true)}
              className="min-h-11 rounded-full px-3 py-2 text-[var(--neon-coral)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--neon-cyan)]"
            >
              Neu starten
            </button>
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

      {confirmRestart ? (
        <div
          className="glass-panel glass-panel-strong space-y-3 p-4 md:p-5"
          role="alertdialog"
          aria-labelledby="restart-title"
          aria-describedby="restart-desc"
        >
          <h2
            id="restart-title"
            className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]"
          >
            Neu starten?
          </h2>
          <p id="restart-desc" className="text-sm text-[var(--muted-strong)]">
            Deine bisherigen Antworten werden gelöscht.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmDoRestart}
              className="glass-btn glass-btn-primary min-h-11 px-5 text-sm"
            >
              Ja, neu starten
            </button>
            <button
              type="button"
              onClick={() => setConfirmRestart(false)}
              className="glass-btn glass-btn-secondary min-h-11 px-5 text-sm"
            >
              Weitermachen
            </button>
          </div>
        </div>
      ) : null}

      <div key={item.id} className="animate-rise space-y-2 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
          {item.prompt}
        </h1>
        {item.helpText ? (
          <p className="text-sm text-[var(--muted-strong)] md:text-base">
            {item.helpText}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {item.choices.map((choice, i) => {
          const isSelected = selectedId === choice.id;
          const wasAnswered = answers[item.id] === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => choose(choice.id)}
              disabled={locked && !isSelected}
              aria-label={`${choice.label}. ${choice.hint}`}
              aria-pressed={wasAnswered || isSelected}
              className={`glass-panel glass-choice glass-sheen touch-target p-3 sm:p-4 ${
                isSelected ? "glass-choice-pop" : ""
              } ${wasAnswered && !selectedId ? "glass-choice-picked" : ""}`}
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
                <p className="text-sm leading-relaxed text-[var(--muted-strong)]">
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
            setIndex((i) => Math.max(0, i - 1));
          }}
          className="glass-btn glass-btn-secondary min-h-11 self-start px-5 py-2 text-sm"
        >
          Zurück
        </button>
      ) : null}
    </div>
  );
}
