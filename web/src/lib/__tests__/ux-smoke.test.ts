import { describe, expect, it } from "vitest";
import { buildProfilePdf } from "@/lib/profilePdf";
import { scoreAssessment } from "@/lib/scoring";
import {
  firstChoiceAnswers,
  loadAllProfiles,
  loadMvpItems,
  loadOccupationSeeds,
} from "./helpers";
import { resumeIndex, hasPartialProgress } from "@/lib/session";
import { containsAxisCodeJargon } from "@/lib/plainLanguage";

describe("UX critical-path smoke (logical)", () => {
  it("landing-bound assessment → ergebnis payload is crash-free and plain", () => {
    const items = loadMvpItems();
    const profiles = loadAllProfiles();
    const occupations = loadOccupationSeeds();
    expect(items.length).toBeGreaterThan(5);

    const partial = Object.fromEntries(
      items.slice(0, 3).map((it) => [it.id, it.choices[0]!.id]),
    );
    expect(hasPartialProgress(items, partial)).toBe(true);
    expect(resumeIndex(items, partial)).toBe(3);

    const full = firstChoiceAnswers(items);
    const result = scoreAssessment(items, full, profiles, occupations);

    expect(result.plainProfile.oneLine.length).toBeGreaterThan(10);
    expect(result.plainProfile.howYouWork.length).toBeGreaterThan(0);
    expect(result.plainProfile.attractiveFields.length).toBeGreaterThan(0);
    expect(result.plainProfile.tips.length).toBeGreaterThan(0);
    expect(result.plainProfile.roleLabel.length).toBeGreaterThan(0);
    expect(result.occupations.length).toBeGreaterThan(0);
    expect(result.exclusions?.length).toBeGreaterThan(0);
    expect(result.qualityLabel).toBeTruthy();
    expect(result.plainSummary.some((l) => /Orientierung|Diagnose/i.test(l))).toBe(
      true,
    );
    expect(containsAxisCodeJargon(result.plainProfile.oneLine)).toBe(false);

    const doc = buildProfilePdf({
      plain: result.plainProfile,
      primaryCode: result.primaryCode,
      qualityLabel: result.qualityLabel,
      exclusions: result.exclusions,
      coverageHint: result.coverageHint,
      occupations: result.occupations,
    });
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it("profiles catalog has reachable codes", () => {
    const codes = loadAllProfiles().map((p) => p.code.toLowerCase());
    expect(codes).toEqual(expect.arrayContaining(["enfj", "infp", "entj"]));
  });
});
