/**
 * Assessment module map — stages, intros, sequencing, progress, coverage.
 * Pure helpers; safe for Vitest without DOM.
 */
import type { AssessmentItem, AxisId, ModuleId, RiasecId } from "./types";

const AXIS_IDS: AxisId[] = ["E_I", "S_N", "T_F", "J_P"];
const RIASEC_IDS: RiasecId[] = ["R", "I", "A", "S", "E", "C"];

/** Deep pictorial flow: Warmup → HOW stages → RIASEC → Abschluss. */
export const MODULE_ORDER: ModuleId[] = [
  "warmup",
  "wahrnehmen",
  "entscheiden",
  "energie",
  "interessen",
  "abschluss",
];

export const MODULE_LABELS: Record<ModuleId, string> = {
  warmup: "Ankommen",
  wahrnehmen: "Denken & Wahrnehmen",
  entscheiden: "Entscheiden",
  energie: "Energie & Arbeit",
  interessen: "Was dich anzieht",
  abschluss: "Druck & Antrieb",
};

/** One-sentence stage intros (soft-tested length). */
export const MODULE_INTROS: Record<ModuleId, string> = {
  warmup: "Zwei kurze Bilder — einfach die erste Reaktion.",
  wahrnehmen: "Wie nimmst du Informationen eher wahr?",
  entscheiden: "Wonach richtet sich deine Entscheidung?",
  energie: "Wovon tankst du — und wie arbeitest du?",
  interessen: "Welche Tätigkeiten ziehen dich eher an?",
  abschluss: "Unter Druck und was dich antreibt.",
};

/** Soft UX caps for structure copy. */
export const STAGE_INTRO_SOFT_MAX = 72;
export const CHOICE_LABEL_SOFT_MAX = 28;
export const PROMPT_SOFT_MAX = 80;

/**
 * Canonical item sequence for psychometric flow:
 * axis blocks split into stages; RIASEC interleaved; stress↔motives mixed.
 */
export const ITEM_SEQUENCE: readonly string[] = [
  // warmup — easy E_I openers
  "ei_01",
  "ei_02",
  // wahrnehmen — S_N
  "sn_01",
  "sn_03",
  "sn_02",
  "sn_04",
  // entscheiden — T_F
  "tf_01",
  "tf_03",
  "tf_02",
  "tf_04",
  // energie — remaining E_I + J_P
  "ei_03",
  "jp_01",
  "jp_03",
  "jp_02",
  // interessen — RIASEC interleaved
  "r_01",
  "i_01",
  "a_01",
  "s_01",
  "e_01",
  "c_01",
  "r_02",
  "i_02",
  "a_02",
  "e_02",
  "a_03",
  // abschluss — stress ↔ motives
  "stress_01",
  "motive_01",
  "stress_02",
  "motive_02",
  "stress_03",
  "motive_03",
  "stress_04",
] as const;

/** Expected module per item id (source of truth for catalog rewrite + tests). */
export const ITEM_MODULE: Readonly<Record<string, ModuleId>> = {
  ei_01: "warmup",
  ei_02: "warmup",
  sn_01: "wahrnehmen",
  sn_02: "wahrnehmen",
  sn_03: "wahrnehmen",
  sn_04: "wahrnehmen",
  tf_01: "entscheiden",
  tf_02: "entscheiden",
  tf_03: "entscheiden",
  tf_04: "entscheiden",
  ei_03: "energie",
  jp_01: "energie",
  jp_02: "energie",
  jp_03: "energie",
  r_01: "interessen",
  r_02: "interessen",
  i_01: "interessen",
  i_02: "interessen",
  a_01: "interessen",
  a_02: "interessen",
  a_03: "interessen",
  s_01: "interessen",
  e_01: "interessen",
  e_02: "interessen",
  c_01: "interessen",
  stress_01: "abschluss",
  stress_02: "abschluss",
  stress_03: "abschluss",
  stress_04: "abschluss",
  motive_01: "abschluss",
  motive_02: "abschluss",
  motive_03: "abschluss",
};

/** Hard coverage floors for the pictorial MVP. */
export const COVERAGE_TARGETS = {
  axisMinItems: 3,
  riasecMinItems: 1,
  stageMinItems: 2,
} as const;

export interface StageBounds {
  module: ModuleId;
  label: string;
  intro: string;
  startIndex: number;
  endIndex: number;
  count: number;
}

export interface ProgressSnapshot {
  answeredCount: number;
  itemCount: number;
  overallPercent: number;
  /** Current 1-based question index (clamped). */
  questionNumber: number;
  /** Stage of the current index. */
  stage: StageBounds;
  stageIndex: number;
  stageCount: number;
  /** Answers within the current stage / stage size. */
  stageAnswered: number;
  stagePercent: number;
}

export interface ModuleCoverageCell {
  module: ModuleId;
  itemCount: number;
  axes: Partial<Record<AxisId, number>>;
  riasec: Partial<Record<RiasecId, number>>;
}

function emptyAxisHits(): Record<AxisId, number> {
  return { E_I: 0, S_N: 0, T_F: 0, J_P: 0 };
}

function emptyRiasecHits(): Record<RiasecId, number> {
  return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
}

/** Sort items by canonical sequence, then module order, then id. */
export function orderAssessmentItems(
  items: AssessmentItem[],
): AssessmentItem[] {
  const seq = new Map(ITEM_SEQUENCE.map((id, i) => [id, i]));
  const mod = new Map(MODULE_ORDER.map((m, i) => [m, i]));
  return [...items].sort((a, b) => {
    const sa = seq.get(a.id);
    const sb = seq.get(b.id);
    if (sa !== undefined && sb !== undefined && sa !== sb) return sa - sb;
    if (sa !== undefined && sb === undefined) return -1;
    if (sa === undefined && sb !== undefined) return 1;
    const ma = mod.get(a.module) ?? 99;
    const mb = mod.get(b.module) ?? 99;
    if (ma !== mb) return ma - mb;
    return a.id.localeCompare(b.id);
  });
}

/** Contiguous stage bounds from an ordered item list. */
export function buildStageBounds(items: AssessmentItem[]): StageBounds[] {
  const bounds: StageBounds[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const last = bounds[bounds.length - 1];
    if (last && last.module === item.module) {
      last.endIndex = i;
      last.count += 1;
      continue;
    }
    bounds.push({
      module: item.module,
      label: MODULE_LABELS[item.module],
      intro: MODULE_INTROS[item.module],
      startIndex: i,
      endIndex: i,
      count: 1,
    });
  }
  return bounds;
}

export function stageAtIndex(
  items: AssessmentItem[],
  index: number,
): StageBounds | null {
  if (!items.length) return null;
  const clamped = Math.max(0, Math.min(index, items.length - 1));
  const bounds = buildStageBounds(items);
  return (
    bounds.find((b) => clamped >= b.startIndex && clamped <= b.endIndex) ??
    null
  );
}

export function computeProgress(
  items: AssessmentItem[],
  answers: Record<string, string>,
  index: number,
): ProgressSnapshot {
  const itemCount = items.length;
  const answeredCount = items.filter((it) => {
    const choiceId = answers[it.id];
    if (!choiceId) return false;
    return it.choices.some((c) => c.id === choiceId);
  }).length;
  const overallPercent =
    itemCount === 0 ? 0 : Math.round((answeredCount / itemCount) * 100);
  const questionNumber =
    itemCount === 0 ? 0 : Math.min(index + 1, itemCount);
  const bounds = buildStageBounds(items);
  const stage =
    stageAtIndex(items, index) ??
    bounds[0] ??
    ({
      module: MODULE_ORDER[0]!,
      label: MODULE_LABELS[MODULE_ORDER[0]!],
      intro: MODULE_INTROS[MODULE_ORDER[0]!],
      startIndex: 0,
      endIndex: 0,
      count: 0,
    } satisfies StageBounds);
  const stageIndex = Math.max(
    0,
    bounds.findIndex((b) => b.module === stage.module),
  );
  const stageSlice = items.slice(stage.startIndex, stage.endIndex + 1);
  const stageAnswered = stageSlice.filter((it) => {
    const choiceId = answers[it.id];
    if (!choiceId) return false;
    return it.choices.some((c) => c.id === choiceId);
  }).length;
  const stagePercent =
    stage.count === 0 ? 0 : Math.round((stageAnswered / stage.count) * 100);

  return {
    answeredCount,
    itemCount,
    overallPercent,
    questionNumber,
    stage,
    stageIndex,
    stageCount: bounds.length || MODULE_ORDER.length,
    stageAnswered,
    stagePercent,
  };
}

/** Items that claim each axis / RIASEC letter (any choice weight). */
export function traitItemCoverage(items: AssessmentItem[]): {
  axes: Record<AxisId, number>;
  riasec: Record<RiasecId, number>;
} {
  const axes = emptyAxisHits();
  const riasec = emptyRiasecHits();
  for (const item of items) {
    const seenAxis = new Set<AxisId>();
    const seenRiasec = new Set<RiasecId>();
    for (const choice of item.choices) {
      for (const id of AXIS_IDS) {
        if (choice.weights.axes?.[id] !== undefined) seenAxis.add(id);
      }
      for (const id of RIASEC_IDS) {
        if (choice.weights.riasec?.[id] !== undefined) seenRiasec.add(id);
      }
    }
    for (const id of seenAxis) axes[id] += 1;
    for (const id of seenRiasec) riasec[id] += 1;
  }
  return { axes, riasec };
}

/** Module × trait coverage matrix for hard structure tests. */
export function moduleCoverageMatrix(
  items: AssessmentItem[],
): ModuleCoverageCell[] {
  return MODULE_ORDER.map((module) => {
    const slice = items.filter((it) => it.module === module);
    const { axes, riasec } = traitItemCoverage(slice);
    const axesPartial: Partial<Record<AxisId, number>> = {};
    const riasecPartial: Partial<Record<RiasecId, number>> = {};
    for (const id of AXIS_IDS) {
      if (axes[id] > 0) axesPartial[id] = axes[id];
    }
    for (const id of RIASEC_IDS) {
      if (riasec[id] > 0) riasecPartial[id] = riasec[id];
    }
    return {
      module,
      itemCount: slice.length,
      axes: axesPartial,
      riasec: riasecPartial,
    };
  });
}

/** Soft structure report: orphans, missing modules, intro length. */
export function analyzeStructureIntegrity(items: AssessmentItem[]): {
  orphanModules: string[];
  missingModules: ModuleId[];
  unknownItemIds: string[];
  missingItemIds: string[];
  moduleMismatchIds: string[];
  introOverLimit: ModuleId[];
  ok: boolean;
} {
  const present = new Set(items.map((i) => i.module));
  const orphanModules = [...present].filter(
    (m) => !MODULE_ORDER.includes(m as ModuleId),
  );
  const missingModules = MODULE_ORDER.filter((m) => !present.has(m));
  const catalogIds = new Set(items.map((i) => i.id));
  const unknownItemIds = items
    .map((i) => i.id)
    .filter((id) => !(id in ITEM_MODULE));
  const missingItemIds = ITEM_SEQUENCE.filter((id) => !catalogIds.has(id));
  const moduleMismatchIds = items
    .filter((it) => ITEM_MODULE[it.id] && ITEM_MODULE[it.id] !== it.module)
    .map((it) => it.id);
  const introOverLimit = MODULE_ORDER.filter(
    (m) => MODULE_INTROS[m].length > STAGE_INTRO_SOFT_MAX,
  );
  return {
    orphanModules,
    missingModules,
    unknownItemIds,
    missingItemIds,
    moduleMismatchIds,
    introOverLimit,
    ok:
      orphanModules.length === 0 &&
      missingModules.length === 0 &&
      unknownItemIds.length === 0 &&
      missingItemIds.length === 0 &&
      moduleMismatchIds.length === 0 &&
      introOverLimit.length === 0,
  };
}
