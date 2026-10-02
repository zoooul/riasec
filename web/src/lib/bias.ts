import { AXIS_IDS, MODULE_ORDER, RIASEC_IDS } from "./constants";
import type {
  AssessmentItem,
  AssessmentResult,
  AxisId,
  BiasFlags,
  ConfidenceLevel,
  ModuleId,
  QualityLabel,
  RiasecId,
} from "./types";

export const CATALOG_BALANCE = {
  riasecMaxMinRatio: 2.5,
  axisMaxMinRatio: 2.5,
  riasecHitMaxMinRatio: 3,
} as const;

export const ACQUIESCENCE_SHARE = 0.8;
export const LOW_COVERAGE_RATIO = 0.5;

export const TRAIT_EXCLUSIONS: string[] = [
  "keine klinische Diagnose oder Störung",
  "keine Intelligenz- oder Begabungsmessung",
  "keine Aussagen zu Herkunft oder Ethnie",
  "keine politischen oder religiösen Zuschreibungen",
  "keine Aussagen zu sexueller Orientierung",
  "keine medizinischen Befunde",
];

const ABSOLUTE_PATTERNS: { re: RegExp; soft: string }[] = [
  { re: /\bimmer\b/gi, soft: "oft" },
  { re: /\bnie\b/gi, soft: "selten" },
  { re: /\bniemals\b/gi, soft: "selten" },
  { re: /\bperfekt(?:e|en|er|es)?\b/gi, soft: "sehr gut" },
  { re: /\babsolut\b/gi, soft: "eher" },
  { re: /\bstets\b/gi, soft: "oft" },
];

export interface ResponsePatternAnalysis {
  answeredCount: number;
  itemCount: number;
  coverageRatio: number;
  dominantChoiceIndexShare: number;
  dominantChoiceIndex: number | null;
  answeredModules: ModuleId[];
  catalogModules: ModuleId[];
  missingModules: ModuleId[];
}

export interface CatalogBalanceReport {
  riasecAbs: Record<RiasecId, number>;
  axisAbs: Record<AxisId, number>;
  riasecPosHits: Record<RiasecId, number>;
  riasecMaxMinRatio: number;
  axisMaxMinRatio: number;
  riasecHitMaxMinRatio: number;
  withinSoftThresholds: boolean;
}

function emptyRiasecAbs(): Record<RiasecId, number> {
  return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
}

function emptyAxisAbs(): Record<AxisId, number> {
  return { E_I: 0, S_N: 0, T_F: 0, J_P: 0 };
}

function maxMinRatio(values: number[]): number {
  const positive = values.filter((v) => v > 0);
  if (positive.length < 2) return 1;
  const max = Math.max(...positive);
  const min = Math.min(...positive);
  if (min <= 0) return Number.POSITIVE_INFINITY;
  return max / min;
}

export function analyzeResponsePattern(
  items: AssessmentItem[],
  answers: Record<string, string>,
): ResponsePatternAnalysis {
  const catalogModules = [
    ...new Set(items.map((item) => item.module)),
  ] as ModuleId[];
  catalogModules.sort(
    (a, b) => MODULE_ORDER.indexOf(a) - MODULE_ORDER.indexOf(b),
  );

  const indexCounts = new Map<number, number>();
  const answeredModules = new Set<ModuleId>();
  let answeredCount = 0;

  for (const item of items) {
    const choiceId = answers[item.id];
    if (!choiceId) continue;
    const idx = item.choices.findIndex((c) => c.id === choiceId);
    if (idx < 0) continue;
    answeredCount += 1;
    answeredModules.add(item.module);
    indexCounts.set(idx, (indexCounts.get(idx) ?? 0) + 1);
  }

  let dominantChoiceIndex: number | null = null;
  let dominantCount = 0;
  for (const [idx, count] of indexCounts) {
    if (count > dominantCount) {
      dominantCount = count;
      dominantChoiceIndex = idx;
    }
  }

  return {
    answeredCount,
    itemCount: items.length,
    coverageRatio: items.length > 0 ? answeredCount / items.length : 0,
    dominantChoiceIndexShare:
      answeredCount > 0 ? dominantCount / answeredCount : 0,
    dominantChoiceIndex,
    answeredModules: [...answeredModules],
    catalogModules,
    missingModules: catalogModules.filter((m) => !answeredModules.has(m)),
  };
}

export function buildBiasFlags(analysis: ResponsePatternAnalysis): BiasFlags {
  const lowCoverage = analysis.coverageRatio < LOW_COVERAGE_RATIO;
  const acquiescence =
    analysis.answeredCount >= 4 &&
    analysis.dominantChoiceIndexShare >= ACQUIESCENCE_SHARE;
  return {
    acquiescence,
    lowDifferentiation: acquiescence,
    lowCoverage,
    missingModules: analysis.missingModules,
  };
}

export function sanitizeResultText(text: string): string {
  let out = text;
  for (const { re, soft } of ABSOLUTE_PATTERNS) {
    out = out.replace(re, soft);
  }
  return out;
}

export function countAbsoluteLanguageHits(text: string): number {
  let hits = 0;
  for (const { re } of ABSOLUTE_PATTERNS) {
    re.lastIndex = 0;
    const matches = text.match(re);
    if (matches) hits += matches.length;
  }
  return hits;
}

function confidenceFromFlags(
  flags: BiasFlags,
  coverageRatio: number,
): ConfidenceLevel {
  if (flags.lowCoverage || flags.missingModules.length > 0) return "low";
  if (flags.acquiescence || flags.lowDifferentiation) return "medium";
  if (coverageRatio < 0.85) return "medium";
  return "high";
}

function qualityFromFlags(flags: BiasFlags): QualityLabel {
  if (flags.lowCoverage || flags.missingModules.length > 0) return "orientierung";
  if (flags.acquiescence || flags.lowDifferentiation) return "unsicher";
  return "ok";
}

function sanitizeLines(lines: string[]): string[] {
  return lines.map(sanitizeResultText);
}

export function applyBiasGuards(
  result: AssessmentResult,
  flags: BiasFlags,
  analysis: ResponsePatternAnalysis,
): AssessmentResult {
  const confidence = confidenceFromFlags(flags, analysis.coverageRatio);
  const qualityLabel = qualityFromFlags(flags);

  let plainSummary = sanitizeLines(result.plainSummary);
  const howBullets = result.howBullets.map((block) => ({
    ...block,
    bullets: sanitizeLines(block.bullets),
  }));
  const blendBullets = sanitizeLines(result.blendBullets);
  let occupations = result.occupations.map((job) => ({
    ...job,
    why: sanitizeResultText(job.why),
    titleDe: sanitizeResultText(job.titleDe),
  }));

  const preface: string[] = [];
  if (qualityLabel === "orientierung") {
    preface.push(
      "Noch nicht alles beantwortet — das Ergebnis ist nur eine grobe Orientierung.",
    );
    plainSummary = plainSummary.map((line) =>
      line.replace(
        /Dein Hauptmuster liegt bei/,
        "Ein vorläufiges Muster deutet auf",
      ),
    );
    occupations = occupations.slice(0, 2).map((job) => ({
      ...job,
      why: `Nur Orientierung — ${job.why}`,
    }));
  }
  if (flags.acquiescence || flags.lowDifferentiation) {
    preface.push(
      "Viele Antworten sehen ähnlich aus — nimm das Ergebnis eher vorsichtig.",
    );
  }
  if (flags.missingModules.length > 0) {
    preface.push(`Es fehlen Antworten in: ${flags.missingModules.join(", ")}.`);
  }
  plainSummary = [...preface, ...plainSummary];
  if (!plainSummary.some((l) => /Orientierung|nicht normiert|Sicherheit|Diagnose/i.test(l))) {
    plainSummary.push(
      "Hinweis: Dieses Ergebnis ist ein erster Orientierungstest und noch nicht normiert.",
    );
  }

  const plainProfile = {
    ...result.plainProfile,
    oneLine: sanitizeResultText(result.plainProfile.oneLine),
    howYouWork: sanitizeLines(result.plainProfile.howYouWork),
    attractiveFields: sanitizeLines(result.plainProfile.attractiveFields),
    tips: sanitizeLines(result.plainProfile.tips),
  };

  const rank: Record<ConfidenceLevel, number> = {
    high: 2,
    medium: 1,
    low: 0,
  };
  const mergedConfidence: ConfidenceLevel =
    result.confidence == null
      ? confidence
      : rank[confidence] < rank[result.confidence]
        ? confidence
        : result.confidence;

  return {
    ...result,
    plainSummary,
    plainProfile,
    howBullets,
    blendBullets,
    occupations,
    biasFlags: flags,
    confidence: mergedConfidence,
    qualityLabel,
    exclusions: [...TRAIT_EXCLUSIONS],
    coverageRatio: result.coverageRatio ?? analysis.coverageRatio,
    coverageHint:
      result.coverageHint ||
      `Basierend auf ${analysis.answeredCount} von ${analysis.itemCount} Fragen`,
    isIncomplete: Boolean(result.isIncomplete) || flags.lowCoverage,
  };
}

export function analyzeCatalogBalance(
  items: AssessmentItem[],
): CatalogBalanceReport {
  const riasecAbs = emptyRiasecAbs();
  const axisAbs = emptyAxisAbs();
  const riasecPosHits = emptyRiasecAbs();
  for (const item of items) {
    for (const choice of item.choices) {
      for (const id of RIASEC_IDS) {
        const v = choice.weights.riasec?.[id];
        if (typeof v === "number") {
          riasecAbs[id] += Math.abs(v);
          if (v > 0) riasecPosHits[id] += 1;
        }
      }
      for (const id of AXIS_IDS) {
        const v = choice.weights.axes?.[id];
        if (typeof v === "number") axisAbs[id] += Math.abs(v);
      }
    }
  }
  const riasecMaxMinRatio = maxMinRatio(RIASEC_IDS.map((id) => riasecAbs[id]));
  const axisMaxMinRatio = maxMinRatio(AXIS_IDS.map((id) => axisAbs[id]));
  const riasecHitMaxMinRatio = maxMinRatio(
    RIASEC_IDS.map((id) => riasecPosHits[id]),
  );
  return {
    riasecAbs,
    axisAbs,
    riasecPosHits,
    riasecMaxMinRatio,
    axisMaxMinRatio,
    riasecHitMaxMinRatio,
    withinSoftThresholds:
      riasecMaxMinRatio <= CATALOG_BALANCE.riasecMaxMinRatio &&
      axisMaxMinRatio <= CATALOG_BALANCE.axisMaxMinRatio &&
      riasecHitMaxMinRatio <= CATALOG_BALANCE.riasecHitMaxMinRatio,
  };
}
