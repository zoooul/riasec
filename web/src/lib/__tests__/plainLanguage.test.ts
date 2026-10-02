import { describe, expect, it } from "vitest";
import {
  buildPlainProfile,
  containsAxisCodeJargon,
  zwischenLabelsInWords,
} from "@/lib/plainLanguage";
import type { AxisScore, ClusterMatch, VistProfile } from "@/lib/types";

const axes = (values: Partial<Record<AxisScore["id"], number>>): AxisScore[] =>
  (["E_I", "S_N", "T_F", "J_P"] as const).map((id) => ({
    id,
    value: values[id] ?? 40,
    poleLow: "low",
    poleHigh: "high",
    plain: "x",
  }));

const primary: ClusterMatch = {
  code: "INFJ",
  role: "Psychologe",
  weight: 0.4,
  isPrimary: true,
  isZwischen: false,
};

const profile: VistProfile = {
  code: "INFJ",
  role: "Psychologe",
  system: "test",
  source: { file: "t", licenseLayer: "owned", notes: "" },
  dimensions: { E_I: "I", S_N: "N", T_F: "F", J_P: "J" },
  sections: {
    staerken: ["Du erkennst früh, was Menschen brauchen."],
    schwaechen: ["Routinearbeit fällt dir schwer."],
  },
};

describe("plain-language summary builder", () => {
  it("uses worded Zwischenprofile instead of letter pairs", () => {
    const labels = zwischenLabelsInWords({
      E_I: 10,
      S_N: 50,
      T_F: -5,
      J_P: 40,
    });
    expect(labels).toEqual(
      expect.arrayContaining([
        "teils für dich, teils mit anderen",
        "teils Fakten, teils Menschen",
      ]),
    );
    expect(labels.join(" ")).not.toMatch(/\b[EISTNFJP]\b.*\b[EISTNFJP]\b/);
  });

  it("builds primary lines without raw axis codes", () => {
    const plain = buildPlainProfile({
      primary,
      clusters: [
        primary,
        {
          code: "ENFP",
          role: "Enthusiast",
          weight: 0.2,
          isPrimary: false,
          isZwischen: true,
        },
      ],
      axes: axes({ E_I: -30, S_N: 45, T_F: 20, J_P: 8 }),
      riasec: { R: 0, I: 40, A: 20, S: 50, E: 5, C: 0 },
      occupations: [
        {
          id: "coach",
          titleDe: "Coach",
          riasec: "SAE",
          score: 0.8,
          why: "passt",
        },
      ],
      primaryProfile: profile,
    });

    const primaryLines = [
      plain.oneLine,
      ...plain.howYouWork,
      ...plain.attractiveFields,
      ...plain.tips,
    ];
    for (const line of primaryLines) {
      expect(containsAxisCodeJargon(line), line).toBe(false);
      expect(line).not.toMatch(/\bINFJ\b/);
      expect(line).not.toMatch(/zwischen [EISTNFJP] und [EISTNFJP]/);
    }
    expect(plain.howYouWork.length).toBeGreaterThanOrEqual(3);
    expect(plain.howYouWork.length).toBeLessThanOrEqual(5);
    expect(plain.tips.length).toBeGreaterThanOrEqual(1);
    expect(plain.tips.length).toBeLessThanOrEqual(2);
    expect(plain.attractiveFields.length).toBeGreaterThan(0);
  });
});
