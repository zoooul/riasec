import { SESSION_ANSWERS_KEY } from "./constants";

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
