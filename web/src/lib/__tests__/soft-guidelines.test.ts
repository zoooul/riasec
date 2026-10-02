/**
 * Soft guideline heuristics — content quality / balance.
 * Failures indicate drift to review; keep thresholds loose.
 * See docs/GUIDELINES.md §4–§6.
 */
import { describe, expect, it } from "vitest";
import {
  ABSOLUTE_WORDS,
  analyzeCatalogBalance,
  CATALOG_BALANCE,
  ONE_LINE_SOFT_MAX,
  PRIMARY_LINE_SOFT_MAX,
  sanitizeResultText,
} from "@/lib/bias";
import { containsAxisCodeJargon } from "@/lib/plainLanguage";
import { scoreAssessment } from "@/lib/scoring";
import {
  firstChoiceAnswers,
  loadAllProfiles,
  loadMvpItems,
  loadOccupationSeeds,
} from "./helpers";

describe("soft · UX copy quality", () => {
  it("primary plainProfile lines avoid axis/MBTI jargon and stay short", () => {
    const items = loadMvpItems();
    const result = scoreAssessment(
      items,
      firstChoiceAnswers(items),
      loadAllProfiles(),
      loadOccupationSeeds(),
    );
    const primary = [
      result.plainProfile.oneLine,
      ...result.plainProfile.howYouWork,
      ...result.plainProfile.attractiveFields,
      ...result.plainProfile.tips,
    ];

    for (const line of primary) {
      expect(containsAxisCodeJargon(line), line).toBe(false);
      expect(line).not.toMatch(/\bE_I\b|\bS_N\b|\bT_F\b|\bJ_P\b/);
      // Prefer role words in hero; ENTJ-style codes belong in Details only.
      expect(line).not.toMatch(/\b[EI][NS][TF][JP]\b/);
    }

    expect(result.plainProfile.oneLine.length).toBeLessThanOrEqual(
      ONE_LINE_SOFT_MAX,
    );
    for (const line of [
      ...result.plainProfile.howYouWork,
      ...result.plainProfile.tips,
    ]) {
      expect(line.length, line).toBeLessThanOrEqual(PRIMARY_LINE_SOFT_MAX);
    }
  });

  it("sanitizer clears banned absolute words from result-facing text", () => {
    const dirty =
      "Du bist immer perfekt und nie unsicher, absolut stets klar, niemals schwach.";
    const clean = sanitizeResultText(dirty).toLowerCase();
    for (const word of ABSOLUTE_WORDS) {
      expect(clean, word).not.toMatch(new RegExp(`\\b${word}\\b`));
    }

    const items = loadMvpItems();
    const result = scoreAssessment(
      items,
      firstChoiceAnswers(items),
      loadAllProfiles(),
      loadOccupationSeeds(),
    );
    const blob = [
      ...result.plainSummary,
      result.plainProfile.oneLine,
      ...result.plainProfile.howYouWork,
      ...result.plainProfile.tips,
      ...result.howBullets.flatMap((b) => b.bullets),
      ...result.occupations.map((o) => o.why),
    ]
      .join(" ")
      .toLowerCase();

    for (const word of ABSOLUTE_WORDS) {
      expect(blob, `absolute word leaked: ${word}`).not.toMatch(
        new RegExp(`\\b${word}\\b`),
      );
    }
  });
});

describe("soft · catalog balance", () => {
  it("MVP catalog stays within soft max/min ratios", () => {
    const report = analyzeCatalogBalance(loadMvpItems());
    // Soft: warn-level thresholds from guidelines — keep as expect so drift is visible.
    expect(report.riasecMaxMinRatio).toBeLessThanOrEqual(
      CATALOG_BALANCE.riasecMaxMinRatio,
    );
    expect(report.axisMaxMinRatio).toBeLessThanOrEqual(
      CATALOG_BALANCE.axisMaxMinRatio,
    );
    expect(report.riasecHitMaxMinRatio).toBeLessThanOrEqual(
      CATALOG_BALANCE.riasecHitMaxMinRatio,
    );
    expect(report.withinSoftThresholds).toBe(true);
  });
});

describe("soft · profile JSON core sections", () => {
  /** Always expected — present across the current extract. */
  const REQUIRED = ["eigenschaften", "staerken", "motivation", "schwaechen"] as const;
  /** HOW blocks used by scoring; some extracts still miss stress / rolle_im_team. */
  const HOW_SOFT = ["staerken", "motivation", "rolle_im_team", "stress"] as const;

  it("every VIST profile has non-empty required sections; HOW gaps stay bounded", () => {
    const profiles = loadAllProfiles();
    expect(profiles.length).toBe(16);
    let howGaps = 0;
    for (const profile of profiles) {
      expect(profile.role.trim().length).toBeGreaterThan(2);
      for (const key of REQUIRED) {
        const bullets = profile.sections[key] ?? [];
        expect(bullets.length, `${profile.code}.${key} empty`).toBeGreaterThan(0);
        expect(bullets[0]!.trim().length).toBeGreaterThan(3);
      }
      const filledHow = HOW_SOFT.filter(
        (key) => (profile.sections[key] ?? []).length > 0,
      );
      howGaps += HOW_SOFT.length - filledHow.length;
      // Soft: at least 2 of 4 HOW sections so blend/howBullets still work.
      expect(filledHow.length, `${profile.code} HOW coverage`).toBeGreaterThanOrEqual(2);
    }
    // Soft catalog budget — document remaining gaps in GUIDELINES backlog.
    expect(howGaps).toBeLessThanOrEqual(6);
  });
});
