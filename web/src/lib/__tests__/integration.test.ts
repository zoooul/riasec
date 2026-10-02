import { describe, expect, it } from "vitest";
import {
  resolveItemStimuli,
  validateItemCatalog,
} from "@/lib/assessment/catalog";
import { scoreAssessment } from "@/lib/scoring";
import {
  firstChoiceAnswers,
  loadAllProfiles,
  loadMvpItems,
  loadOccupationSeeds,
  loadStimulusIndex,
} from "./helpers";

describe("assessment item catalog integrity", () => {
  it("has unique item/choice ids and nested weights on every choice", () => {
    const items = loadMvpItems();
    expect(items.length).toBeGreaterThanOrEqual(10);

    const issues = validateItemCatalog(items);
    const errors = issues.filter((i) => i.level === "error");
    expect(errors).toEqual([]);

    const itemIds = new Set(items.map((i) => i.id));
    expect(itemIds.size).toBe(items.length);
  });

  it("resolves every choice motif against the stimulus registry", () => {
    const items = loadMvpItems();
    const index = loadStimulusIndex();
    const resolved = resolveItemStimuli(items, index);

    for (const item of resolved) {
      for (const choice of item.choices) {
        expect(choice.stimulusId, `motif ${choice.visual.motif}`).toBeTruthy();
        expect(choice.stimulusAttribution).toBeTruthy();
      }
    }
  });
});

describe("full assessment integration", () => {
  it("scores a complete answer set into primary cluster + occupations + howBullets", () => {
    const items = loadMvpItems();
    const profiles = loadAllProfiles();
    const occupations = loadOccupationSeeds();
    const answers = firstChoiceAnswers(items);

    const result = scoreAssessment(items, answers, profiles, occupations);

    expect(result.answeredCount).toBe(items.length);
    expect(result.itemCount).toBe(items.length);
    expect(result.primaryCode).toMatch(/^[EI][SN][TF][JP]$/);
    expect(result.clusters.length).toBeGreaterThan(0);
    expect(result.clusters[0]?.isPrimary).toBe(true);
    expect(result.clusters[0]?.code).toBe(result.primaryCode);
    expect(result.howBullets.length).toBeGreaterThan(0);
    expect(result.howBullets.every((b) => b.bullets.length > 0)).toBe(true);
    expect(result.occupations.length).toBeGreaterThan(0);
    expect(result.occupations[0]?.titleDe).toBeTruthy();
    expect(result.riasecCode.length).toBe(3);
    expect(result.plainSummary.length).toBeGreaterThan(0);
    expect(result.axes).toHaveLength(4);
  });
});
