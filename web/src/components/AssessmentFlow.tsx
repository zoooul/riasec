"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    () => Math.round((Object.keys(answers).length / items.length) * 100),
    [answers, items.length],
  );

  if (!item) return null;

  function choose(choiceId: string) {
    const nextAnswers = { ...answers, [item.id]: choiceId };
    setAnswers(nextAnswers);

    if (index >= items.length - 1) {
      const payload = encodeURIComponent(JSON.stringify(nextAnswers));
      router.push(`/ergebnis?a=${payload}`);
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-[var(--muted)]">
          <span>
            Frage {index + 1} von {items.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--chip)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${Math.max(progress, ((index + 1) / items.length) * 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--ink)] md:text-4xl">
          {item.prompt}
        </h1>
        {item.helpText ? (
          <p className="text-[var(--muted)]">{item.helpText}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {item.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => choose(choice.id)}
            className="group rounded-3xl border border-[var(--line)] bg-[var(--card)] p-4 text-left shadow-[0_10px_30px_rgba(30,40,35,0.06)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <VisualCard kind={choice.visual.kind} motif={choice.visual.motif} />
            <div className="mt-4 space-y-1">
              <div className="text-lg font-semibold text-[var(--ink)]">
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
          className="self-start text-sm text-[var(--muted)] underline-offset-4 hover:underline"
        >
          Zurück
        </button>
      ) : null}
    </div>
  );
}
