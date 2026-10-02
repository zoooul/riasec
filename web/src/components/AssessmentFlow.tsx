"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MODULE_LABELS } from "@/lib/constants";
import { saveAnswers } from "@/lib/session";
import type { AssessmentItem } from "@/lib/types";
import { VisualCard } from "./VisualCard";

type Props = {
  items: AssessmentItem[];
};

export function AssessmentFlow({ items }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const item = items[index];
  const progress = useMemo(
    () => Math.round(((index + (answers[item?.id ?? ""] ? 1 : 0)) / items.length) * 100),
    [answers, index, item?.id, items.length],
  );

  if (!item) return null;

  function choose(choiceId: string) {
    const nextAnswers = { ...answers, [item.id]: choiceId };
    setAnswers(nextAnswers);
    saveAnswers(nextAnswers);

    if (index >= items.length - 1) {
      router.push("/ergebnis");
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 pb-[max(1.5rem,var(--safe-bottom))] md:gap-8 md:py-10">
      <div className="glass-panel space-y-3 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <span className="glass-chip">{MODULE_LABELS[item.module]}</span>
          <span>
            {index + 1}/{items.length}
          </span>
        </div>
        <div className="glass-progress" aria-hidden>
          <span style={{ width: `${Math.max(progress, ((index + 1) / items.length) * 100)}%` }} />
        </div>
      </div>

      <div className="animate-rise space-y-2 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
          {item.prompt}
        </h1>
        {item.helpText ? (
          <p className="text-sm text-[var(--muted)] md:text-base">{item.helpText}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {item.choices.map((choice, i) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => choose(choice.id)}
            className="glass-panel glass-choice glass-sheen p-3 sm:p-4"
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
        ))}
      </div>

      {index > 0 ? (
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="glass-btn glass-btn-secondary self-start px-5 py-2 text-sm"
        >
          Zurück
        </button>
      ) : null}
    </div>
  );
}
