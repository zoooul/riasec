import { SESSION_ANSWERS_KEY } from "./constants";
import type { AssessmentItem } from "./types";

export { SESSION_ANSWERS_KEY };

/** Stable empty snapshot — never allocate a fresh `{}` for getSnapshot. */
const EMPTY_ANSWERS: Readonly<Record<string, string>> = Object.freeze({});

let cachedRaw: string | null | undefined = undefined;
let cachedSnapshot: Record<string, string> = EMPTY_ANSWERS as Record<
  string,
  string
>;

function invalidateSnapshotCache() {
  cachedRaw = undefined;
}

/** Test helper — reset in-memory snapshot cache after clearing storage. */
export function resetAnswersCache() {
  cachedRaw = undefined;
  cachedSnapshot = EMPTY_ANSWERS as Record<string, string>;
}

/**
 * Cached answers snapshot for `useSyncExternalStore`.
 * Returning a new object from getSnapshot every render causes an infinite loop.
 */
export function getAnswersSnapshot(): Record<string, string> {
  if (typeof window === "undefined") {
    return EMPTY_ANSWERS as Record<string, string>;
  }
  const raw = window.sessionStorage.getItem(SESSION_ANSWERS_KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = EMPTY_ANSWERS as Record<string, string>;
    return cachedSnapshot;
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    cachedSnapshot =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : (EMPTY_ANSWERS as Record<string, string>);
  } catch {
    cachedSnapshot = EMPTY_ANSWERS as Record<string, string>;
  }
  return cachedSnapshot;
}

/** Server snapshot for hydration — always the same empty reference. */
export function getServerAnswersSnapshot(): Record<string, string> | null {
  return null;
}

export function saveAnswers(answers: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_ANSWERS_KEY, JSON.stringify(answers));
  invalidateSnapshotCache();
  cachedRaw = window.sessionStorage.getItem(SESSION_ANSWERS_KEY);
  cachedSnapshot = answers;
}

export function loadAnswers(): Record<string, string> {
  return getAnswersSnapshot();
}

export function clearAnswers() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_ANSWERS_KEY);
  invalidateSnapshotCache();
  cachedRaw = null;
  cachedSnapshot = EMPTY_ANSWERS as Record<string, string>;
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
