import { SESSION_ANSWERS_KEY } from "./constants";
import type { AssessmentItem } from "./types";

export { SESSION_ANSWERS_KEY };

export function saveAnswers(answers: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_ANSWERS_KEY, JSON.stringify(answers));
}

export function loadAnswers(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_ANSWERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function clearAnswers() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_ANSWERS_KEY);
}

/** Count answers that match a known item id. */
export function countValidAnswers(
  items: AssessmentItem[],
  answers: Record<string, string>,
): number {
  let n = 0;
  for (const item of items) {
    const choiceId = answers[item.id];
    if (!choiceId) continue;
    if (item.choices.some((c) => c.id === choiceId)) n += 1;
  }
  return n;
}

/**
 * Index to resume: first unanswered item, or last item if complete.
 * Returns 0 when there are no answers yet.
 */
export function resumeIndex(
  items: AssessmentItem[],
  answers: Record<string, string>,
): number {
  if (!items.length) return 0;
  const firstOpen = items.findIndex((item) => {
    const choiceId = answers[item.id];
    if (!choiceId) return true;
    return !item.choices.some((c) => c.id === choiceId);
  });
  if (firstOpen === -1) return items.length - 1;
  return firstOpen;
}

export function hasPartialProgress(
  items: AssessmentItem[],
  answers: Record<string, string>,
): boolean {
  const n = countValidAnswers(items, answers);
  return n > 0 && n < items.length;
}
