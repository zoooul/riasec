/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  SESSION_ANSWERS_KEY,
  clearAnswers,
  countValidAnswers,
  hasPartialProgress,
  loadAnswers,
  resetAnswersCache,
  resumeIndex,
  saveAnswers,
} from "@/lib/session";
import type { AssessmentItem } from "@/lib/types";

afterEach(() => {
  window.sessionStorage.clear();
  resetAnswersCache();
});

function miniItems(): AssessmentItem[] {
  return [
    {
      id: "i1",
      module: "personality",
      prompt: "1",
      choices: [
        {
          id: "i1_a",
          label: "A",
          hint: "",
          visual: { kind: "pattern", motif: "a" },
          weights: { axes: { E_I: 10 } },
        },
        {
          id: "i1_b",
          label: "B",
          hint: "",
          visual: { kind: "pattern", motif: "b" },
          weights: { axes: { E_I: -10 } },
        },
      ],
      source: {
        sourceId: "t",
        license: "own",
        layer: "core",
        changeStatus: "own_construction",
        validationStatus: "unvalidated",
      },
    },
    {
      id: "i2",
      module: "personality",
      prompt: "2",
      choices: [
        {
          id: "i2_a",
          label: "A",
          hint: "",
          visual: { kind: "pattern", motif: "a" },
          weights: { axes: { S_N: 10 } },
        },
      ],
      source: {
        sourceId: "t",
        license: "own",
        layer: "core",
        changeStatus: "own_construction",
        validationStatus: "unvalidated",
      },
    },
    {
      id: "i3",
      module: "interests",
      prompt: "3",
      choices: [
        {
          id: "i3_a",
          label: "A",
          hint: "",
          visual: { kind: "scene", motif: "a" },
          weights: { riasec: { R: 10 } },
        },
      ],
      source: {
        sourceId: "t",
        license: "own",
        layer: "core",
        changeStatus: "own_construction",
        validationStatus: "unvalidated",
      },
    },
  ];
}

describe("session save/load", () => {
  it("round-trips answers through sessionStorage", () => {
    const answers = { sn_01: "sn_01_a", ei_01: "ei_01_b" };
    saveAnswers(answers);
    expect(loadAnswers()).toEqual(answers);
    expect(window.sessionStorage.getItem(SESSION_ANSWERS_KEY)).toContain(
      "sn_01",
    );
  });

  it("returns {} for missing or corrupt storage", () => {
    expect(loadAnswers()).toEqual({});
    window.sessionStorage.setItem(SESSION_ANSWERS_KEY, "{not-json");
    expect(loadAnswers()).toEqual({});
  });

  it("caches getSnapshot identity when storage is unchanged", () => {
    expect(loadAnswers()).toBe(loadAnswers());
    saveAnswers({ sn_01: "sn_01_a" });
    const a = loadAnswers();
    const b = loadAnswers();
    expect(a).toBe(b);
    expect(a).toEqual({ sn_01: "sn_01_a" });
    clearAnswers();
    expect(loadAnswers()).toBe(loadAnswers());
  });

  it("clearAnswers removes the key", () => {
    saveAnswers({ a: "b" });
    clearAnswers();
    expect(loadAnswers()).toEqual({});
    expect(window.sessionStorage.getItem(SESSION_ANSWERS_KEY)).toBeNull();
  });
});

describe("session restore helpers", () => {
  it("resumeIndex returns first unanswered item", () => {
    const items = miniItems();
    expect(resumeIndex(items, {})).toBe(0);
    expect(resumeIndex(items, { i1: "i1_a" })).toBe(1);
    expect(resumeIndex(items, { i1: "i1_a", i2: "i2_a" })).toBe(2);
  });

  it("resumeIndex lands on last item when complete", () => {
    const items = miniItems();
    const full = { i1: "i1_a", i2: "i2_a", i3: "i3_a" };
    expect(resumeIndex(items, full)).toBe(2);
    expect(hasPartialProgress(items, full)).toBe(false);
  });

  it("detects partial progress and ignores unknown choice ids", () => {
    const items = miniItems();
    expect(hasPartialProgress(items, { i1: "i1_a" })).toBe(true);
    expect(countValidAnswers(items, { i1: "not-a-choice", i2: "i2_a" })).toBe(
      1,
    );
  });
});
