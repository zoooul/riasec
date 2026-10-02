import { describe, expect, it } from "vitest";
import { matchOccupations, type OccupationSeed } from "@/lib/occupations";
import type { RiasecId } from "@/lib/types";

const seeds: OccupationSeed[] = [
  {
    id: "handwerk",
    titleDe: "Handwerk",
    riasec: "RIC",
    vector: { R: 90, I: 40, A: 10, S: 20, E: 25, C: 45 },
  },
  {
    id: "sozial",
    titleDe: "Sozial",
    riasec: "SAE",
    vector: { R: 15, I: 30, A: 40, S: 95, E: 35, C: 25 },
  },
  {
    id: "analyse",
    titleDe: "Analyse",
    riasec: "IRC",
    vector: { R: 30, I: 95, A: 25, S: 15, E: 20, C: 55 },
  },
];

function vec(partial: Partial<Record<RiasecId, number>>): Record<RiasecId, number> {
  return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, ...partial };
}

describe("occupation cosine match", () => {
  it("ranks social seed highest for S-heavy user vector", () => {
    const matches = matchOccupations(vec({ S: 90, A: 40, E: 30 }), seeds, 3);
    expect(matches[0]?.id).toBe("sozial");
    expect(matches[0]?.score).toBeGreaterThan(matches[1]?.score ?? 0);
    expect(matches[0]?.why.toLowerCase()).toContain("sozial");
  });

  it("returns empty list for empty seeds", () => {
    expect(matchOccupations(vec({ R: 50 }), [], 4)).toEqual([]);
  });

  it("returns 0 score when user vector is all zeros", () => {
    const matches = matchOccupations(vec({}), seeds, 1);
    expect(matches[0]?.score).toBe(0);
  });
});
