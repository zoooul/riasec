/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import {
  CHOICE_KEY_HINTS,
  isEditableKeyboardTarget,
  resolveAssessmentChoiceIndex,
  shouldHandleAssessmentShortcut,
} from "@/lib/assessmentShortcuts";

describe("assessmentShortcuts", () => {
  it("maps 1/a/A/ArrowLeft to choice 0 and 2/b/B/ArrowRight to choice 1", () => {
    expect(resolveAssessmentChoiceIndex("1")).toBe(0);
    expect(resolveAssessmentChoiceIndex("a")).toBe(0);
    expect(resolveAssessmentChoiceIndex("A")).toBe(0);
    expect(resolveAssessmentChoiceIndex("ArrowLeft")).toBe(0);

    expect(resolveAssessmentChoiceIndex("2")).toBe(1);
    expect(resolveAssessmentChoiceIndex("b")).toBe(1);
    expect(resolveAssessmentChoiceIndex("B")).toBe(1);
    expect(resolveAssessmentChoiceIndex("ArrowRight")).toBe(1);

    expect(resolveAssessmentChoiceIndex("3")).toBeNull();
    expect(resolveAssessmentChoiceIndex("Enter")).toBeNull();
  });

  it("exposes DaisyUI-ready key hints with aria-keyshortcuts", () => {
    expect(CHOICE_KEY_HINTS[0]).toEqual({
      number: "1",
      letter: "A",
      aria: "1 a ArrowLeft",
    });
    expect(CHOICE_KEY_HINTS[1]).toEqual({
      number: "2",
      letter: "B",
      aria: "2 b ArrowRight",
    });
  });

  it("ignores editable targets, modal, lock, and modifier keys", () => {
    const input = document.createElement("input");
    expect(isEditableKeyboardTarget(input)).toBe(true);
    expect(isEditableKeyboardTarget(document.createElement("div"))).toBe(false);

    expect(
      shouldHandleAssessmentShortcut({
        key: "1",
        target: document.body,
        locked: false,
        modalOpen: false,
      }),
    ).toBe(0);

    expect(
      shouldHandleAssessmentShortcut({
        key: "1",
        target: document.body,
        locked: true,
        modalOpen: false,
      }),
    ).toBeNull();

    expect(
      shouldHandleAssessmentShortcut({
        key: "2",
        target: document.body,
        locked: false,
        modalOpen: true,
      }),
    ).toBeNull();

    expect(
      shouldHandleAssessmentShortcut({
        key: "a",
        target: input,
        locked: false,
        modalOpen: false,
      }),
    ).toBeNull();

    expect(
      shouldHandleAssessmentShortcut({
        key: "1",
        target: document.body,
        locked: false,
        modalOpen: false,
        metaKey: true,
      }),
    ).toBeNull();
  });
});
