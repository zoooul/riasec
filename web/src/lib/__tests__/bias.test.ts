import { describe, expect, it } from "vitest";
import {
  ACQUIESCENCE_SHARE,
  analyzeCatalogBalance,
  analyzeResponsePattern,
  applyBiasGuards,
  buildBiasFlags,
  countAbsoluteLanguageHits,
  sanitizeResultText,
  TRAIT_EXCLUSIONS,
} from "@/lib/bias";
import { scoreAssessment } from "@/lib/scoring";
import type {
  AssessmentItem,
  AssessmentResult,
  VistProfile,
} from "@/lib/types";

const miniProfiles: VistProfile[] = [
  {
    code: "ENTJ",
    role: "General",
    system: "test",
    source: { file: "t", licenseLayer: "owned", notes: "" },
    dimensions: { E_I: "E", S_N: "N", T_F: "T", J_P: "J" },
    sections: {
      staerken: ["Analytisch führen — immer klar."],
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
  module: AssessmentItem["module"] = "personality",
): AssessmentItem {
  return {
    id,
    module,
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

function bipolar(id: string, module: AssessmentItem["module"] = "personality") {
  return item(
    id,
    [
      {
        id: `${id}_a`,
        label: "A",
        hint: "",
        visual: { kind: "pattern", motif: "a" },
        weights: { axes: { E_I: 35, S_N: 30, T_F: -25, J_P: -20 } },
      },
      {
        id: `${id}_b`,
        label: "B",
        hint: "",
        visual: { kind: "pattern", motif: "b" },
        weights: { axes: { E_I: -35, S_N: -30, T_F: 25, J_P: 20 } },
      },
    ],
    module,
  );
}

function baseResult(
  overrides: Partial<AssessmentResult> = {},
): AssessmentResult {
  return {
    answeredCount: 8,
    itemCount: 8,
    coverageRatio: 1,
    coverageHint: "Basierend auf 8 von 8 Fragen",
    confidence: "high",
    isIncomplete: false,
    axes: [],
    bigFive: { O: 0, C: 0, E: 0, A: 0, N: 0 },
    riasec: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    riasecCode: "IAS",
    clusters: [
      {
        code: "ENTJ",
        role: "General",
        weight: 0.6,
        isPrimary: true,
        isZwischen: false,
      },
    ],
    primaryCode: "ENTJ",
    zwischenLabels: [],
    plainSummary: [
      "Dein Hauptmuster liegt bei „General“.",
      "Hinweis: Das ist eine Orientierung — keine Diagnose.",
    ],
    plainProfile: {
      oneLine:
        "Du arbeitest oft wie jemand, der als „General“ beschrieben wird.",
      howYouWork: ["Du bist immer perfekt fokussiert."],
      attractiveFields: ["Untersuchend"],
      tips: ["Plane Pausen."],
      roleLabel: "General",
    },
    howBullets: [
      {
        title: "Was dir leichtfällt",
        bullets: ["Du bist immer perfekt fokussiert."],
      },
    ],
    blendBullets: [],
    occupations: [
      {
        id: "job1",
        titleDe: "Beispielberuf",
        riasec: "EIA",
        score: 0.9,
        why: "Passt zu deinem Hang zu unternehmerisch.",
      },
      {
        id: "job2",
        titleDe: "Zweiter Beruf",
        riasec: "IAS",
        score: 0.8,
        why: "Passt grob.",
      },
      {
        id: "job3",
        titleDe: "Dritter Beruf",
        riasec: "SAE",
        score: 0.7,
        why: "Passt grob.",
      },
    ],
    ...overrides,
  };
}

describe("analyzeResponsePattern / acquiescence", () => {
  it("flags near-identical first-option clicking", () => {
    const items = [1, 2, 3, 4, 5].map((n) => bipolar(`p${n}`));
    const answers = Object.fromEntries(
      items.map((it) => [it.id, it.choices[0]!.id]),
    );
    const analysis = analyzeResponsePattern(items, answers);
    expect(analysis.dominantChoiceIndexShare).toBeGreaterThanOrEqual(
      ACQUIESCENCE_SHARE,
    );
    const flags = buildBiasFlags(analysis);
    expect(flags.acquiescence).toBe(true);
    expect(flags.lowDifferentiation).toBe(true);
  });

  it("does not flag mixed choice indices", () => {
    const items = [1, 2, 3, 4, 5, 6].map((n) => bipolar(`m${n}`));
    const answers = Object.fromEntries(
      items.map((it, i) => [it.id, it.choices[i % 2]!.id]),
    );
    const flags = buildBiasFlags(analyzeResponsePattern(items, answers));
    expect(flags.acquiescence).toBe(false);
  });
});

describe("low coverage / missing module", () => {
  it("marks <50% coverage as lowCoverage → Orientierung and softens Beruf claims", () => {
    const items = [
      ...[1, 2, 3, 4].map((n) => bipolar(`c${n}`, "personality")),
      ...[1, 2, 3, 4].map((n) => bipolar(`i${n}`, "interests")),
    ];
    const answers = {
      c1: items[0]!.choices[0]!.id,
      c2: items[1]!.choices[0]!.id,
      c3: items[2]!.choices[0]!.id,
    };
    const analysis = analyzeResponsePattern(items, answers);
    expect(analysis.coverageRatio).toBeLessThan(0.5);
    const flags = buildBiasFlags(analysis);
    expect(flags.lowCoverage).toBe(true);
    expect(flags.missingModules).toContain("interests");

    const guarded = applyBiasGuards(baseResult(), flags, analysis);
    expect(guarded.qualityLabel).toBe("orientierung");
    expect(guarded.confidence).toBe("low");
    expect(guarded.isIncomplete).toBe(true);
    expect(guarded.occupations.length).toBeLessThanOrEqual(2);
    expect(guarded.occupations[0]?.why).toMatch(/Orientierung/);
    expect(guarded.plainSummary.some((l) => /Orientierung/i.test(l))).toBe(
      true,
    );
  });
});

describe("social desirability / absolute language sanitizer", () => {
  it("softens immer/nie/perfekt in plainSummary, HOW, and plainProfile", () => {
    expect(sanitizeResultText("Du bist immer perfekt und nie unsicher.")).toBe(
      "Du bist oft sehr gut und selten unsicher.",
    );
    expect(countAbsoluteLanguageHits("immer nie perfekt")).toBe(3);

    const analysis = analyzeResponsePattern([], {});
    const guarded = applyBiasGuards(baseResult(), buildBiasFlags(analysis), {
      ...analysis,
      coverageRatio: 1,
      answeredCount: 8,
      itemCount: 8,
    });
    const joined = [
      ...guarded.plainSummary,
      ...guarded.howBullets.flatMap((b) => b.bullets),
      ...guarded.plainProfile.howYouWork,
    ].join(" ");
    expect(joined.toLowerCase()).not.toMatch(/\bimmer\b/);
    expect(joined.toLowerCase()).not.toMatch(/\bperfekt\b/);
  });
});

describe("trait overclaim exclusions", () => {
  it("always attaches exclusions covering clinical/intelligence/protected traits", () => {
    const items = [bipolar("e1")];
    const result = scoreAssessment(items, { e1: "e1_a" }, miniProfiles);
    expect(result.exclusions).toEqual(TRAIT_EXCLUSIONS);
    const blob = result.exclusions?.join(" ") ?? "";
    expect(blob).toMatch(/klinische/i);
    expect(blob).toMatch(/Intelligenz/i);
    expect(blob).toMatch(/Ethnie/i);
    expect(blob).toMatch(/politischen/i);
    expect(blob).toMatch(/sexueller/i);
    expect(blob).toMatch(/medizinischen/i);
  });
});

describe("item catalog balance (soft thresholds)", () => {
  it("reports max/min ratios for RIASEC and axes on a balanced catalog", () => {
    const letters = ["R", "I", "A", "S", "E", "C"] as const;
    const balanced: AssessmentItem[] = letters.map((letter, i) =>
      item(
        `bal_${letter}`,
        [
          {
            id: `bal_${letter}_a`,
            label: "a",
            hint: "",
            visual: { kind: "scene", motif: "x" },
            weights: {
              riasec: { [letter]: 40 },
              axes: {
                E_I: i % 2 === 0 ? 20 : -20,
                S_N: i % 2 === 0 ? 20 : -20,
                T_F: i % 2 === 0 ? 20 : -20,
                J_P: i % 2 === 0 ? 20 : -20,
              },
            },
          },
          {
            id: `bal_${letter}_b`,
            label: "b",
            hint: "",
            visual: { kind: "scene", motif: "y" },
            weights: { riasec: { [letter]: 10 } },
          },
        ],
        "interests",
      ),
    );
    const report = analyzeCatalogBalance(balanced);
    expect(report.withinSoftThresholds).toBe(true);
    expect(report.riasecMaxMinRatio).toBeLessThanOrEqual(2.5);
  });
});

describe("scoreAssessment bias wiring", () => {
  it("softens certainty when all answers are first-option", () => {
    const items = [1, 2, 3, 4, 5, 6].map((n) => bipolar(`w${n}`));
    const answers = Object.fromEntries(
      items.map((it) => [it.id, it.choices[0]!.id]),
    );
    const result = scoreAssessment(items, answers, miniProfiles);
    expect(result.biasFlags?.acquiescence).toBe(true);
    expect(result.qualityLabel).toBe("unsicher");
    expect(result.confidence).toBe("medium");
    expect(
      result.plainSummary.some((l) => /ähnlich|vorsichtig|Sicherheit/i.test(l)),
    ).toBe(true);
  });
});
