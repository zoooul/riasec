/**
 * Soft structure / UX heuristics for the deep assessment module map.
 * See docs/GUIDELINES.md §4–§6 and assessmentStructure.ts.
 */
import { describe, expect, it } from "vitest";
import { sortAssessmentItems } from "@/lib/assessment/catalog";
import {
  CHOICE_LABEL_SOFT_MAX,
  ITEM_SEQUENCE,
  MODULE_INTROS,
  MODULE_ORDER,
  PROMPT_SOFT_MAX,
  STAGE_INTRO_SOFT_MAX,
  TASK_TITLE_SOFT_MAX,
  analyzeStructureIntegrity,
  buildStageBounds,
  computeProgress,
  orderAssessmentItems,
} from "@/lib/assessmentStructure";
import { loadMvpItems } from "./helpers";

describe("soft · assessment structure map", () => {
  it("module map covers all items with no orphans or mismatches", () => {
    const items = loadMvpItems();
    const report = analyzeStructureIntegrity(items);
    expect(report.orphanModules).toEqual([]);
    expect(report.missingModules).toEqual([]);
    expect(report.unknownItemIds).toEqual([]);
    expect(report.missingItemIds).toEqual([]);
    expect(report.moduleMismatchIds).toEqual([]);
    expect(report.ok).toBe(true);
    expect(items.length).toBe(ITEM_SEQUENCE.length);
  });

  it("stage intros and pictorial prompts/labels stay short", () => {
    for (const module of MODULE_ORDER) {
      expect(MODULE_INTROS[module].length, module).toBeLessThanOrEqual(
        STAGE_INTRO_SOFT_MAX,
      );
      expect(MODULE_INTROS[module].length).toBeGreaterThan(8);
    }

    for (const item of loadMvpItems()) {
      expect(item.prompt.length, item.id).toBeLessThanOrEqual(PROMPT_SOFT_MAX);
      expect(item.task, item.id).toBeTruthy();
      expect(["scene", "pattern", "solve"]).toContain(item.task!.kind);
      expect(item.task!.title.length, item.id).toBeGreaterThan(2);
      expect(item.task!.title.length, item.id).toBeLessThanOrEqual(
        TASK_TITLE_SOFT_MAX,
      );
      for (const choice of item.choices) {
        expect(choice.label.length, choice.id).toBeLessThanOrEqual(
          CHOICE_LABEL_SOFT_MAX,
        );
      }
    }
  });

  it("progress math tracks answered/total and stage boundaries", () => {
    const items = orderAssessmentItems(loadMvpItems());
    const bounds = buildStageBounds(items);
    expect(bounds.map((b) => b.module)).toEqual(MODULE_ORDER);
    expect(bounds.reduce((n, b) => n + b.count, 0)).toBe(items.length);

    const partial = Object.fromEntries(
      items.slice(0, 3).map((it) => [it.id, it.choices[0]!.id]),
    );
    const at = computeProgress(items, partial, 3);
    expect(at.answeredCount).toBe(3);
    expect(at.itemCount).toBe(items.length);
    expect(at.overallPercent).toBe(Math.round((3 / items.length) * 100));
    expect(at.questionNumber).toBe(4);
    expect(at.stage.module).toBe(items[3]!.module);
    expect(at.stageCount).toBe(MODULE_ORDER.length);

    const empty = computeProgress(items, {}, 0);
    expect(empty.overallPercent).toBe(0);
    expect(empty.stage.module).toBe("warmup");
    expect(empty.stageAnswered).toBe(0);
  });

  it("canonical sort matches ITEM_SEQUENCE", () => {
    const shuffled = [...loadMvpItems()].reverse();
    const ordered = sortAssessmentItems(shuffled);
    expect(ordered.map((i) => i.id)).toEqual([...ITEM_SEQUENCE]);
  });
});
