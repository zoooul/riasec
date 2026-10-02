/**
 * Hard structure / psychometric coverage for the deep assessment module map.
 * See docs/GUIDELINES.md §3, §6.
 */
import { describe, expect, it } from "vitest";
import { validateItemCatalog } from "@/lib/assessment/catalog";
import {
  COVERAGE_TARGETS,
  ITEM_SEQUENCE,
  MODULE_ORDER,
  TRANSPARENCY_BANNED,
  moduleCoverageMatrix,
  orderAssessmentItems,
  traitItemCoverage,
} from "@/lib/assessmentStructure";
import { AXIS_IDS, RIASEC_IDS, ZWISCHEN_THRESHOLD } from "@/lib/constants";
import { scoreAssessment } from "@/lib/scoring";
import type { AxisId } from "@/lib/types";
import {
  firstChoiceAnswers,
  lastChoiceAnswers,
  loadAllProfiles,
  loadMvpItems,
  loadOccupationSeeds,
} from "./helpers";

describe("hard · module coverage matrix", () => {
  it("every stage has items; HOW/RIASEC traits meet floors", () => {
    const items = orderAssessmentItems(loadMvpItems());
    const matrix = moduleCoverageMatrix(items);

    expect(matrix.map((c) => c.module)).toEqual(MODULE_ORDER);
    for (const cell of matrix) {
      expect(cell.itemCount, cell.module).toBeGreaterThanOrEqual(
        COVERAGE_TARGETS.stageMinItems,
      );
    }

    const warmup = matrix.find((c) => c.module === "warmup")!;
    expect(warmup.axes.E_I).toBeGreaterThanOrEqual(2);

    const wahrnehmen = matrix.find((c) => c.module === "wahrnehmen")!;
    expect(wahrnehmen.axes.S_N).toBeGreaterThanOrEqual(4);

    const entscheiden = matrix.find((c) => c.module === "entscheiden")!;
    expect(entscheiden.axes.T_F).toBeGreaterThanOrEqual(4);

    const energie = matrix.find((c) => c.module === "energie")!;
    expect((energie.axes.E_I ?? 0) + (energie.axes.J_P ?? 0)).toBeGreaterThanOrEqual(
      4,
    );

    const interessen = matrix.find((c) => c.module === "interessen")!;
    for (const letter of RIASEC_IDS) {
      expect(interessen.riasec[letter] ?? 0, letter).toBeGreaterThanOrEqual(
        COVERAGE_TARGETS.riasecMinItems,
      );
    }

    const abschluss = matrix.find((c) => c.module === "abschluss")!;
    expect(abschluss.itemCount).toBeGreaterThanOrEqual(6);
  });

  it("catalog-wide axis/RIASEC item floors hold", () => {
    const items = loadMvpItems();
    const { axes, riasec } = traitItemCoverage(items);
    for (const id of AXIS_IDS) {
      expect(axes[id], id).toBeGreaterThanOrEqual(COVERAGE_TARGETS.axisMinItems);
    }
    for (const id of RIASEC_IDS) {
      expect(riasec[id], id).toBeGreaterThanOrEqual(
        COVERAGE_TARGETS.riasecMinItems,
      );
    }
  });
});

describe("hard · nested weights + sequencing invariants", () => {
  it("keeps nested schema, unique sequence, and no flat E collision path", () => {
    const items = orderAssessmentItems(loadMvpItems());
    expect(items.map((i) => i.id)).toEqual([...ITEM_SEQUENCE]);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);

    const errors = validateItemCatalog(items).filter((i) => i.level === "error");
    expect(errors).toEqual([]);

    for (const item of items) {
      for (const choice of item.choices) {
        const w = choice.weights as Record<string, unknown>;
        // Must be nested — never a flat E key at the weights root.
        expect(w).not.toHaveProperty("E");
        expect(w).not.toHaveProperty("R");
        const nested =
          Object.keys(choice.weights.axes ?? {}).length +
          Object.keys(choice.weights.bigFive ?? {}).length +
          Object.keys(choice.weights.riasec ?? {}).length;
        expect(nested, choice.id).toBeGreaterThan(0);
      }
    }
  });

  it("scoreAssessment remains deterministic under new module map", () => {
    const items = loadMvpItems();
    const profiles = loadAllProfiles();
    const occupations = loadOccupationSeeds();
    const answers = firstChoiceAnswers(items);
    const a = scoreAssessment(items, answers, profiles, occupations);
    const b = scoreAssessment(items, answers, profiles, occupations);
    expect(a.primaryCode).toBe(b.primaryCode);
    expect(a.riasecCode).toBe(b.riasecCode);
    expect(a.axes.map((x) => x.value)).toEqual(b.axes.map((x) => x.value));
    expect(a.bigFive.E).not.toBeUndefined();
    expect(a.riasec.E).not.toBeUndefined();

    const opposite = scoreAssessment(
      items,
      lastChoiceAnswers(items),
      profiles,
      occupations,
    );
    expect(opposite.primaryCode).not.toBe(a.primaryCode);
  });

  it(`Zwischenprofile still use |axis| < ${ZWISCHEN_THRESHOLD}`, () => {
    const items = loadMvpItems();
    // Mid-pole mix: first choice on half, last on half → often near zero on some axes.
    const mixed = Object.fromEntries(
      items.map((it, i) => [
        it.id,
        it.choices[i % 2]!.id,
      ]),
    );
    const result = scoreAssessment(
      items,
      mixed,
      loadAllProfiles(),
      loadOccupationSeeds(),
    );
    for (const axis of result.axes) {
      if (Math.abs(axis.value) < ZWISCHEN_THRESHOLD) {
        expect(result.zwischenLabels.length).toBeGreaterThan(0);
        expect(result.zwischenLabels.join(" ")).toMatch(/teils/i);
        break;
      }
    }
  });
});

describe("hard · task format + anti-transparency", () => {
  it("every MVP item has a playful task wrapper", () => {
    const items = loadMvpItems();
    const kinds = new Set<string>();
    for (const item of items) {
      expect(item.task, item.id).toBeTruthy();
      expect(["scene", "pattern", "solve"]).toContain(item.task!.kind);
      expect(item.task!.title.trim().length, item.id).toBeGreaterThan(2);
      kinds.add(item.task!.kind);
    }
    // All three interaction flavors present in the battery.
    expect(kinds.has("scene")).toBe(true);
    expect(kinds.has("pattern")).toBe(true);
    expect(kinds.has("solve")).toBe(true);
  });

  it("choice labels/hints avoid foresightable trait lexemes", () => {
    for (const item of loadMvpItems()) {
      for (const choice of item.choices) {
        const blob = `${choice.label} ${choice.hint}`.toLowerCase();
        for (const word of TRANSPARENCY_BANNED) {
          expect(blob, `${choice.id} contains ${word}`).not.toContain(word);
        }
        expect(blob).not.toMatch(/\b[ei][ns][tf][jp]\b/);
      }
    }
  });

  it("left-index valence is mixed per HOW axis (not always +pole first)", () => {
    const items = loadMvpItems();
    const firstSign: Record<AxisId, { pos: number; neg: number }> = {
      E_I: { pos: 0, neg: 0 },
      S_N: { pos: 0, neg: 0 },
      T_F: { pos: 0, neg: 0 },
      J_P: { pos: 0, neg: 0 },
    };

    for (const item of items) {
      const axes = item.choices[0]?.weights.axes ?? {};
      for (const id of AXIS_IDS) {
        const v = axes[id];
        if (v === undefined || v === 0) continue;
        if (v > 0) firstSign[id].pos += 1;
        else firstSign[id].neg += 1;
      }
    }

    // Each HOW axis that appears on the left must flip polarity at least once.
    for (const id of AXIS_IDS) {
      const { pos, neg } = firstSign[id];
      if (pos + neg < 2) continue;
      expect(pos, `${id} never +first`).toBeGreaterThan(0);
      expect(neg, `${id} never −first`).toBeGreaterThan(0);
    }
  });

  it("boundary stages include soft axis weights for Zwischenprofile fuel", () => {
    const softIds = new Set(["sn_02", "sn_04", "tf_02", "tf_04", "jp_02", "jp_03"]);
    const items = loadMvpItems().filter((it) => softIds.has(it.id));
    expect(items.length).toBe(softIds.size);
    for (const item of items) {
      for (const choice of item.choices) {
        const axes = Object.values(choice.weights.axes ?? {});
        expect(axes.length, choice.id).toBeGreaterThan(0);
        for (const v of axes) {
          expect(Math.abs(v), choice.id).toBeLessThanOrEqual(26);
          expect(Math.abs(v), choice.id).toBeGreaterThanOrEqual(18);
        }
      }
    }
  });
});
