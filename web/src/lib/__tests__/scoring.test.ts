import { describe, expect, it } from "vitest";
import { ZWISCHEN_THRESHOLD } from "@/lib/constants";
import {
  confidenceFromCoverage,
  coverageHintText,
  coverageSoftFactor,
  scoreAssessment,
} from "@/lib/scoring";
import type { AssessmentItem, VistProfile } from "@/lib/types";

const miniProfiles: VistProfile[] = [
  {
    code: "ENTJ",
    role: "General",
    system: "test",
    source: { file: "t", licenseLayer: "owned", notes: "" },
    dimensions: { E_I: "E", S_N: "N", T_F: "T", J_P: "J" },
    sections: {
      staerken: ["Analytisch führen."],
      motivation: ["Wirkung erzielen."],
      rolle_im_team: ["Richtung geben."],
      stress: ["Noch mehr Druck machen."],
    },
  },
  {
    code: "ISFP",
    role: "Künstler",
    system: "test",
    source: { file: "t", licenseLayer: "owned", notes: "" },
    dimensions: { E_I: "I", S_N: "S", T_F: "F", J_P: "P" },
    sections: {
      staerken: ["Feines Gespür."],
      motivation: ["Schönes schaffen."],
      rolle_im_team: ["Harmonie halten."],
      stress: ["Rückzug."],
    },
  },
];

function item(
  id: string,
  choices: AssessmentItem["choices"],
): AssessmentItem {
  return {
    id,
    module: "personality",
    prompt: id,
    choices,
    source: {
      sourceId: "test",
      license: "own",
      layer: "core",
      changeStatus: "own_construction",
      validationStatus: "unvalidated",
    },
  };
}

describe("nested weight scoring", () => {
  it("keeps Big-Five E and RIASEC E in separate buckets (no collision)", () => {
    const items = [
      item("mix_e", [
        {
          id: "mix_e_a",
          label: "A",
          hint: "",
          visual: { kind: "scene", motif: "group" },
          weights: {
            bigFive: { E: 40 },
            riasec: { E: -30 },
          },
        },
        {
          id: "mix_e_b",
          label: "B",
          hint: "",
          visual: { kind: "scene", motif: "quiet" },
          weights: { bigFive: { E: -10 }, riasec: { E: 10 } },
        },
      ]),
    ];

    const result = scoreAssessment(
      items,
      { mix_e: "mix_e_a" },
      miniProfiles,
    );

    expect(result.bigFive.E).toBe(40);
    expect(result.riasec.E).toBe(-30);
    expect(result.bigFive.E).not.toBe(result.riasec.E);
  });

  it("averages axis weights across answered items", () => {
    const items = [
      item("a1", [
        {
          id: "a1_x",
          label: "x",
          hint: "",
          visual: { kind: "pattern", motif: "x" },
          weights: { axes: { E_I: 40 } },
        },
      ]),
      item("a2", [
        {
          id: "a2_x",
          label: "x",
          hint: "",
          visual: { kind: "pattern", motif: "x" },
          weights: { axes: { E_I: 20 } },
        },
      ]),
    ];

    const result = scoreAssessment(
      items,
      { a1: "a1_x", a2: "a2_x" },
      miniProfiles,
    );

    expect(result.axes.find((a) => a.id === "E_I")?.value).toBe(30);
    expect(result.answeredCount).toBe(2);
  });
});

describe("Zwischenprofile thresholds", () => {
  it(`flags mixed axes in plain German when |value| < ${ZWISCHEN_THRESHOLD}`, () => {
    const items = [
      item("z1", [
        {
          id: "z1_a",
          label: "a",
          hint: "",
          visual: { kind: "pattern", motif: "z" },
          weights: {
            axes: { E_I: 10, S_N: 50, T_F: -5, J_P: 40 },
          },
        },
      ]),
    ];

    const result = scoreAssessment(items, { z1: "z1_a" }, miniProfiles);

    expect(result.zwischenLabels).toEqual(
      expect.arrayContaining([
        "Energie: gemischt (eher für dich / eher mit anderen)",
        "Entscheidung: gemischt (Fakten & Logik / Menschen & Werte)",
      ]),
    );
    expect(result.zwischenLabels).not.toEqual(
      expect.arrayContaining([
        "Blick: gemischt (Details & Genauigkeit / Muster & Möglichkeiten)",
        "Arbeitsstil: gemischt (Plan & Abschluss / Flexibel & offen)",
      ]),
    );
    expect(result.zwischenLabels.join(" ")).not.toMatch(/\bzwischen E und I\b/);
    expect(
      result.zwischenLabels.some((l) => l.startsWith("Blick:")),
    ).toBe(false);
  });
});

describe("RIASEC code", () => {
  it("builds top-3 letter code from riasec scores", () => {
    const items = [
      item("r1", [
        {
          id: "r1_a",
          label: "a",
          hint: "",
          visual: { kind: "scene", motif: "r" },
          weights: {
            riasec: { I: 50, A: 40, S: 30, R: 10, E: 5, C: 1 },
          },
        },
      ]),
    ];

    const result = scoreAssessment(items, { r1: "r1_a" }, miniProfiles);
    expect(result.riasecCode).toBe("IAS");
  });
});

describe("coverage / confidence", () => {
  it("exposes coverage hint and incomplete flag", () => {
    const items = [
      item("c1", [
        {
          id: "c1_a",
          label: "a",
          hint: "",
          visual: { kind: "pattern", motif: "c" },
          weights: { axes: { E_I: 40 } },
        },
      ]),
      item("c2", [
        {
          id: "c2_a",
          label: "a",
          hint: "",
          visual: { kind: "pattern", motif: "c" },
          weights: { axes: { E_I: 40 } },
        },
      ]),
      item("c3", [
        {
          id: "c3_a",
          label: "a",
          hint: "",
          visual: { kind: "pattern", motif: "c" },
          weights: { axes: { E_I: 40 } },
        },
      ]),
    ];

    const partial = scoreAssessment(items, { c1: "c1_a" }, miniProfiles);
    expect(partial.coverageHint).toMatch(/1 von 3/);
    expect(partial.isIncomplete).toBe(true);
    expect(partial.confidence).toBe("low");
    expect(partial.coverageRatio).toBeCloseTo(1 / 3);

    const full = scoreAssessment(
      items,
      { c1: "c1_a", c2: "c2_a", c3: "c3_a" },
      miniProfiles,
    );
    expect(full.isIncomplete).toBe(false);
    expect(full.confidence).toBe("high");
    expect(full.coverageHint).toBe(coverageHintText(3, 3));
  });

  it("softens axis magnitude when coverage is thin", () => {
    expect(coverageSoftFactor(1, 10)).toBe(0.5);
    expect(coverageSoftFactor(5, 10)).toBe(0.75);
    expect(coverageSoftFactor(8, 10)).toBe(1);
    expect(confidenceFromCoverage(2, 10)).toBe("low");

    const items = Array.from({ length: 10 }, (_, i) =>
      item(`s${i}`, [
        {
          id: `s${i}_a`,
          label: "a",
          hint: "",
          visual: { kind: "pattern", motif: "s" },
          weights: { axes: { E_I: 40 } },
        },
      ]),
    );

    const thin = scoreAssessment(items, { s0: "s0_a" }, miniProfiles);
    const ei = thin.axes.find((a) => a.id === "E_I")?.value ?? 0;
    // 40 * soft 0.5 = 20
    expect(ei).toBe(20);
  });
});
