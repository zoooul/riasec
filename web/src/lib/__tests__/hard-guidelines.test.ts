/**
 * Hard guideline assertions — must never fail.
 * See docs/GUIDELINES.md §3, §5, §6.
 */
import { describe, expect, it } from "vitest";
import { validateItemCatalog } from "@/lib/assessment/catalog";
import {
  ORIENTIERUNG_JOB_LIMIT,
  TRAIT_EXCLUSIONS,
} from "@/lib/bias";
import { matchOccupations } from "@/lib/occupations";
import { buildPlainProfile } from "@/lib/plainLanguage";
import { buildProfilePdf } from "@/lib/profilePdf";
import { scoreAssessment } from "@/lib/scoring";
import type { AxisScore, ClusterMatch, RiasecId } from "@/lib/types";
import {
  firstChoiceAnswers,
  lastChoiceAnswers,
  loadAllProfiles,
  loadMvpItems,
  loadOccupationSeeds,
} from "./helpers";

describe("hard · nested scoring", () => {
  it("keeps Big-Five E and RIASEC E distinct + scoring is deterministic", () => {
    const items = loadMvpItems();
    const profiles = loadAllProfiles();
    const occupations = loadOccupationSeeds();
    const answers = firstChoiceAnswers(items);
    const result = scoreAssessment(items, answers, profiles, occupations);
    expect(result.bigFive).toHaveProperty("E");
    expect(result.riasec).toHaveProperty("E");

    const again = scoreAssessment(items, answers, profiles, occupations);
    expect(again.primaryCode).toBe(result.primaryCode);
    expect(again.riasecCode).toBe(result.riasecCode);
    expect(again.axes.map((a) => a.value)).toEqual(
      result.axes.map((a) => a.value),
    );
    expect(again.bigFive).toEqual(result.bigFive);
    expect(again.riasec).toEqual(result.riasec);
  });

  it("all-A ≠ all-B primary cluster", () => {
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
  });
});

describe("hard · bias guards", () => {
  it("acquiescence → quality unsicher", () => {
    const items = loadMvpItems();
    const result = scoreAssessment(
      items,
      firstChoiceAnswers(items),
      loadAllProfiles(),
      loadOccupationSeeds(),
    );
    expect(result.biasFlags?.acquiescence).toBe(true);
    expect(result.qualityLabel).toBe("unsicher");
    expect(result.exclusions).toEqual(TRAIT_EXCLUSIONS);
  });

  it("sparse → orientierung + ≤2 jobs + softened claims", () => {
    const items = loadMvpItems();
    const sparse = Object.fromEntries(
      items.slice(0, Math.max(1, Math.floor(items.length * 0.3))).map((it) => [
        it.id,
        it.choices[0]!.id,
      ]),
    );
    const result = scoreAssessment(
      items,
      sparse,
      loadAllProfiles(),
      loadOccupationSeeds(),
    );
    expect(result.qualityLabel).toBe("orientierung");
    expect(result.biasFlags?.lowCoverage).toBe(true);
    expect(result.occupations.length).toBeLessThanOrEqual(
      ORIENTIERUNG_JOB_LIMIT,
    );
    for (const job of result.occupations) {
      expect(job.why).toMatch(/Orientierung|Könnte|vorsichtig/i);
      expect(job.why).not.toMatch(/^Passt zu\b/);
    }
  });

  it("exclusions always present on any scored result", () => {
    const items = loadMvpItems();
    const result = scoreAssessment(
      items,
      { [items[0]!.id]: items[0]!.choices[0]!.id },
      loadAllProfiles(),
    );
    expect(result.exclusions?.length).toBe(TRAIT_EXCLUSIONS.length);
    expect(result.qualityLabel).toBeTruthy();
  });
});

describe("hard · plainLanguage + PDF outputs", () => {
  it("plainLanguage builder always returns required keys", () => {
    const primary: ClusterMatch = {
      code: "ENFP",
      role: "Enthusiast",
      weight: 0.5,
      isPrimary: true,
      isZwischen: false,
    };
    const axes: AxisScore[] = (["E_I", "S_N", "T_F", "J_P"] as const).map(
      (id) => ({
        id,
        value: 25,
        poleLow: "a",
        poleHigh: "b",
        plain: "x",
      }),
    );
    const plain = buildPlainProfile({
      primary,
      clusters: [primary],
      axes,
      riasec: { R: 1, I: 2, A: 3, S: 4, E: 5, C: 0 },
      occupations: [],
    });
    expect(plain).toEqual(
      expect.objectContaining({
        oneLine: expect.any(String),
        howYouWork: expect.any(Array),
        attractiveFields: expect.any(Array),
        tips: expect.any(Array),
        roleLabel: "Enthusiast",
      }),
    );
    expect(plain.oneLine.length).toBeGreaterThan(10);
    expect(plain.howYouWork.length).toBeGreaterThan(0);
  });

  it("PDF helper does not throw with Qualität + exclusions payload", () => {
    const items = loadMvpItems();
    const scored = scoreAssessment(
      items,
      firstChoiceAnswers(items),
      loadAllProfiles(),
      loadOccupationSeeds(),
    );

    // ErgebnisClient-critical plainLanguage strings
    expect(scored.plainProfile.roleLabel.length).toBeGreaterThan(0);
    expect(scored.plainProfile.oneLine).toMatch(/arbeitest|Muster|jemand/i);
    expect(scored.plainProfile.howYouWork.length).toBeGreaterThan(0);
    expect(scored.exclusions?.join(" ")).toMatch(/klinische/i);
    expect(scored.qualityLabel).toBeTruthy();

    expect(() =>
      buildProfilePdf({
        plain: scored.plainProfile,
        primaryCode: scored.primaryCode,
        qualityLabel: scored.qualityLabel,
        exclusions: scored.exclusions,
        coverageHint: scored.coverageHint,
        occupations: scored.occupations,
      }),
    ).not.toThrow();
  });
});

describe("hard · catalog + occupations integrity", () => {
  it("item catalog: unique ids, nested weights, exactly 2 choices", () => {
    const items = loadMvpItems();
    const errors = validateItemCatalog(items).filter((i) => i.level === "error");
    expect(errors).toEqual([]);
    const ids = new Set(items.map((i) => i.id));
    expect(ids.size).toBe(items.length);
    for (const item of items) {
      expect(item.choices.length, item.id).toBe(2);
      for (const choice of item.choices) {
        const w = choice.weights;
        const nested =
          Object.keys(w.axes ?? {}).length +
          Object.keys(w.bigFive ?? {}).length +
          Object.keys(w.riasec ?? {}).length;
        expect(nested, choice.id).toBeGreaterThan(0);
      }
    }
  });

  it("occupations.json loads and matchOccupations returns sorted scores", () => {
    const seeds = loadOccupationSeeds();
    expect(seeds.length).toBeGreaterThan(50);
    const user: Record<RiasecId, number> = {
      R: 10,
      I: 80,
      A: 20,
      S: 15,
      E: 5,
      C: 30,
    };
    const matches = matchOccupations(user, seeds, 5);
    expect(matches.length).toBeGreaterThan(0);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1]!.score).toBeGreaterThanOrEqual(matches[i]!.score);
    }
  });
});
