import { describe, expect, it } from "vitest";
import { scoreAssessment } from "@/lib/scoring";
import {
  firstChoiceAnswers,
  loadAllProfiles,
  loadMvpItems,
  loadOccupationSeeds,
} from "./helpers";

/**
 * Documents the API contract: POST /api/score runs the same pure scorer
 * used by the client Ergebnis path. Route handlers are thin wrappers.
 */
describe("API score contract (mirrors POST /api/score)", () => {
  it("returns a complete AssessmentResult for full answers", () => {
    const items = loadMvpItems();
    const profiles = loadAllProfiles();
    const occupations = loadOccupationSeeds();
    const answers = firstChoiceAnswers(items);

    const result = scoreAssessment(items, answers, profiles, occupations);

    expect(result.answeredCount).toBe(items.length);
    expect(result.isIncomplete).toBe(false);
    expect(result.primaryCode.length).toBeGreaterThan(0);
    expect(result.plainProfile.roleLabel.length).toBeGreaterThan(0);
    expect(result.axes.length).toBe(4);
    expect(Object.keys(result.riasec)).toEqual(
      expect.arrayContaining(["R", "I", "A", "S", "E", "C"]),
    );
  });

  it("flags incomplete runs the same way the route would", () => {
    const items = loadMvpItems();
    const profiles = loadAllProfiles();
    const occupations = loadOccupationSeeds();
    const partial = Object.fromEntries(
      items.slice(0, 2).map((it) => [it.id, it.choices[0]!.id]),
    );

    const result = scoreAssessment(items, partial, profiles, occupations);
    expect(result.isIncomplete).toBe(true);
    expect(result.answeredCount).toBe(2);
  });
});
