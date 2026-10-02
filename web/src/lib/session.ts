export const SESSION_ANSWERS_KEY = "skillster.answers.v1";

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
