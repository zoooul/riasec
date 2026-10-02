/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  SESSION_ANSWERS_KEY,
  clearAnswers,
  loadAnswers,
  saveAnswers,
} from "@/lib/session";

afterEach(() => {
  window.sessionStorage.clear();
});

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

  it("clearAnswers removes the key", () => {
    saveAnswers({ a: "b" });
    clearAnswers();
    expect(loadAnswers()).toEqual({});
    expect(window.sessionStorage.getItem(SESSION_ANSWERS_KEY)).toBeNull();
  });
});
