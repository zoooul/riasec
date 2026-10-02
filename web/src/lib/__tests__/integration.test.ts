import { describe, expect, it } from "vitest";
import {
  resolveItemStimuli,
  validateItemCatalog,
} from "@/lib/assessment/catalog";
import { AXIS_IDS, RIASEC_IDS } from "@/lib/constants";
import { scoreAssessment } from "@/lib/scoring";
import {
  firstChoiceAnswers,
  lastChoiceAnswers,
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

  it("covers every axis and RIASEC letter at least twice", () => {
    const items = loadMvpItems();
    const axisHits: Record<string, number> = Object.fromEntries(
      AXIS_IDS.map((id) => [id, 0]),
    );
    const riasecHits: Record<string, number> = Object.fromEntries(
      RIASEC_IDS.map((id) => [id, 0]),
    );

    for (const item of items) {
      const seenA = new Set<string>();
      const seenR = new Set<string>();
      for (const choice of item.choices) {
        for (const k of Object.keys(choice.weights.axes ?? {})) seenA.add(k);
        for (const k of Object.keys(choice.weights.riasec ?? {})) seenR.add(k);
      }
      for (const k of seenA) axisHits[k] = (axisHits[k] ?? 0) + 1;
      for (const k of seenR) riasecHits[k] = (riasecHits[k] ?? 0) + 1;
    }

    for (const id of AXIS_IDS) {
      expect(axisHits[id], `axis ${id}`).toBeGreaterThanOrEqual(2);
    }
    for (const id of RIASEC_IDS) {
      expect(riasecHits[id], `riasec ${id}`).toBeGreaterThanOrEqual(2);
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
    expect(result.isIncomplete).toBe(false);
    expect(result.coverageHint).toContain(`${items.length} von ${items.length}`);
    expect(result.primaryCode).toMatch(/^[EI][SN][TF][JP]$/);
    expect(result.clusters.length).toBeGreaterThan(0);
    expect(result.clusters[0]?.isPrimary).toBe(true);
    expect(result.clusters[0]?.code).toBe(result.primaryCode);
    expect(result.howBullets.length).toBeGreaterThan(0);
    expect(result.howBullets.every((b) => b.bullets.length > 0)).toBe(true);
    expect(result.occupations.length).toBeGreaterThan(0);
    expect(result.occupations.length).toBeLessThanOrEqual(3);
    expect(result.occupations[0]?.titleDe).toBeTruthy();
    expect(result.riasecCode.length).toBe(3);
    expect(result.plainSummary.length).toBeGreaterThan(0);
    expect(result.axes).toHaveLength(4);
  });

  it("all-A vs all-B choices yield different primary clusters", () => {
    const items = loadMvpItems();
    const profiles = loadAllProfiles();
    const occupations = loadOccupationSeeds();

    const allA = scoreAssessment(
      items,
      firstChoiceAnswers(items),
      profiles,
      occupations,
    );
    const allB = scoreAssessment(
      items,
      lastChoiceAnswers(items),
      profiles,
      occupations,
    );

    expect(allA.primaryCode).not.toBe(allB.primaryCode);
    expect(allA.clusters[0]?.code).not.toBe(allB.clusters[0]?.code);
  });

  it("incomplete answers mark isIncomplete and keep coverage hint", () => {
    const items = loadMvpItems();
    const profiles = loadAllProfiles();
    const partial = Object.fromEntries(
      items.slice(0, 3).map((item) => [item.id, item.choices[0]!.id]),
    );
    const result = scoreAssessment(items, partial, profiles, []);

    expect(result.answeredCount).toBe(3);
    expect(result.isIncomplete).toBe(true);
    expect(result.coverageHint).toBe(
      `Basierend auf 3 von ${items.length} Fragen`,
    );
    expect(result.confidence).not.toBe("high");
  });
});
