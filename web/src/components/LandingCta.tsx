"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  getAnswersSnapshot,
  getServerAnswersSnapshot,
  hasPartialProgress,
  isAssessmentComplete,
  subscribeAnswers,
} from "@/lib/session";
import type { AssessmentItem } from "@/lib/types";

type Props = {
  items: AssessmentItem[];
};

/** Landing primary CTA — adapts to session progress without cloud sync. */
export function LandingCta({ items }: Props) {
  const answers = useSyncExternalStore(
    subscribeAnswers,
    getAnswersSnapshot,
    getServerAnswersSnapshot,
  );

  const ready = answers !== null;
  const complete = ready && isAssessmentComplete(items, answers);
  const partial = ready && hasPartialProgress(items, answers);

  if (!ready) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2 pt-2 lg:mx-0">
        <Button href="/assessment" variant="primary" size="lg" className="w-full">
          Zu den Aufgaben
        </Button>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2 pt-2 lg:mx-0">
        <Button href="/ergebnis" variant="primary" size="lg" className="w-full">
          Ergebnis ansehen
        </Button>
        <Button
          href="/assessment"
          variant="secondary"
          size="sm"
          className="w-full"
        >
          Antworten nochmal prüfen
        </Button>
      </div>
    );
  }

  if (partial) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2 pt-2 lg:mx-0">
        <Button href="/assessment" variant="primary" size="lg" className="w-full">
          Weiter machen
        </Button>
        <p className="meta-label normal-case tracking-[0.04em] text-base-content/45">
          Zwischenspeicher gefunden — dort weitermachen, wo du warst.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-2 pt-2 lg:mx-0">
      <Button href="/assessment" variant="primary" size="lg" className="w-full">
        Zu den Aufgaben
      </Button>
      <p className="meta-label flex flex-wrap items-center justify-center gap-1.5 normal-case tracking-[0.04em] text-base-content/45 lg:justify-start">
        <span>Privat · mobil · Zwischenspeicher</span>
        <span className="inline-flex items-center gap-0.5" aria-hidden>
          <kbd className="kbd kbd-xs">1</kbd>
          <kbd className="kbd kbd-xs">2</kbd>
        </span>
      </p>
    </div>
  );
}
