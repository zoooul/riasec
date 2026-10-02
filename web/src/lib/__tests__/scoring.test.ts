import { describe, expect, it } from "vitest";
import { ZWISCHEN_THRESHOLD } from "@/lib/constants";
import { scoreAssessment } from "@/lib/scoring";
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
    // Flat single-letter map would have overwritten one of these.
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
  it(`flags mixed axes when |value| < ${ZWISCHEN_THRESHOLD}`, () => {
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
        "teils für dich, teils mit anderen",
        "teils Fakten, teils Menschen",
      ]),
    );
    expect(result.zwischenLabels).not.toEqual(
      expect.arrayContaining([
        "teils Details, teils große Ideen",
        "teils planvoll, teils flexibel",
      ]),
    );
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
