/** Keyboard shortcuts for the 2-choice assessment cards. */

export type ChoiceShortcutIndex = 0 | 1;

export const CHOICE_KEY_HINTS = [
  { number: "1", letter: "A", aria: "1 a ArrowLeft" },
  { number: "2", letter: "B", aria: "2 b ArrowRight" },
] as const;

/** Map a KeyboardEvent.key to choice index 0 or 1. */
export function resolveAssessmentChoiceIndex(
  key: string,
): ChoiceShortcutIndex | null {
  if (key === "1" || key === "a" || key === "A" || key === "ArrowLeft") {
    return 0;
  }
  if (key === "2" || key === "b" || key === "B" || key === "ArrowRight") {
    return 1;
  }
  return null;
}

/** True when focus is in a field where digit/letter keys should type, not choose. */
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

export function shouldHandleAssessmentShortcut(options: {
  key: string;
  target: EventTarget | null;
  locked: boolean;
  modalOpen: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}): ChoiceShortcutIndex | null {
  if (options.locked || options.modalOpen) return null;
  if (options.metaKey || options.ctrlKey || options.altKey) return null;
  if (isEditableKeyboardTarget(options.target)) return null;
  return resolveAssessmentChoiceIndex(options.key);
}
