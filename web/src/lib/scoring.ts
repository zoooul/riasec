import {
  AXIS_IDS,
  AXIS_PLAIN,
  BIG_FIVE_IDS,
  COVERAGE_SOFT_HIGH,
  COVERAGE_SOFT_MID,
  HOW_SECTIONS,
  RIASEC_IDS,
  RIASEC_LABELS,
  SECTION_LABELS,
  ZWISCHEN_THRESHOLD,
} from "./constants";
import {
  analyzeResponsePattern,
  applyBiasGuards,
  buildBiasFlags,
} from "./bias";
import { matchOccupations, type OccupationSeed } from "./occupations";
import {
  buildPlainProfile,
  zwischenLabelsInWords,
} from "./plainLanguage";
import type {
  AssessmentItem,
  AssessmentResult,
  AxisId,
  AxisScore,
  BigFiveId,
  ChoiceWeights,
  ClusterMatch,
  ConfidenceLevel,
  RiasecId,
  VistProfile,
} from "./types";

function clamp(n: number, min = -100, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function emptyAxes(): Record<AxisId, number> {
  return { E_I: 0, S_N: 0, T_F: 0, J_P: 0 };
}

function emptyBigFive(): Record<BigFiveId, number> {
  return { O: 0, C: 0, E: 0, A: 0, N: 0 };
}

function emptyRiasec(): Record<RiasecId, number> {
  return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
}

function emptyCounts<T extends string>(ids: readonly T[]): Record<T, number> {
  return Object.fromEntries(ids.map((id) => [id, 0])) as Record<T, number>;
}

function addPartial<T extends string>(
  target: Record<T, number>,
  counts: Record<T, number>,
  partial?: Partial<Record<T, number>>,
) {
  if (!partial) return;
  for (const [key, value] of Object.entries(partial) as [T, number][]) {
    if (typeof value !== "number") continue;
    target[key] = (target[key] ?? 0) + value;
    counts[key] = (counts[key] ?? 0) + 1;
  }
}

function normalizeBucket<T extends string>(
  raw: Record<T, number>,
  counts: Record<T, number>,
  ids: readonly T[],
): Record<T, number> {
  return Object.fromEntries(
    ids.map((id) => {
      const n = counts[id] || 0;
      const avg = n > 0 ? raw[id] / n : 0;
      return [id, clamp(avg)];
    }),
  ) as Record<T, number>;
}

function applyWeights(
  axes: Record<AxisId, number>,
  axesCounts: Record<AxisId, number>,
  bigFive: Record<BigFiveId, number>,
  bigFiveCounts: Record<BigFiveId, number>,
  riasec: Record<RiasecId, number>,
  riasecCounts: Record<RiasecId, number>,
  weights: ChoiceWeights,
) {
  addPartial(axes, axesCounts, weights.axes);
  addPartial(bigFive, bigFiveCounts, weights.bigFive);
  addPartial(riasec, riasecCounts, weights.riasec);
}

function typeVector(profile: VistProfile): Record<AxisId, number> {
  return {
    E_I: profile.dimensions.E_I === "E" ? 50 : -50,
    S_N: profile.dimensions.S_N === "N" ? 50 : -50,
    T_F: profile.dimensions.T_F === "F" ? 50 : -50,
    J_P: profile.dimensions.J_P === "P" ? 50 : -50,
  };
}

function distance(
  axes: Record<AxisId, number>,
  target: Record<AxisId, number>,
): number {
  return Math.sqrt(
    AXIS_IDS.reduce((sum, id) => {
      const d = axes[id] - target[id];
      return sum + d * d;
    }, 0),
  );
}

function softMaxWeights(distances: number[], temperature = 28): number[] {
  const inv = distances.map((d) => Math.exp(-d / temperature));
  const total = inv.reduce((a, b) => a + b, 0) || 1;
  return inv.map((v) => v / total);
}

/** Soften axis/RIASEC magnitudes when few questions were answered. */
export function coverageSoftFactor(answered: number, total: number): number {
  if (total <= 0 || answered <= 0) return 0;
  const ratio = answered / total;
  if (ratio >= COVERAGE_SOFT_HIGH) return 1;
  if (ratio >= COVERAGE_SOFT_MID) return 0.75;
  return 0.5;
}

export function confidenceFromCoverage(
  answered: number,
  total: number,
): ConfidenceLevel {
  if (total <= 0 || answered <= 0) return "low";
  const ratio = answered / total;
  if (ratio >= COVERAGE_SOFT_HIGH) return "high";
  if (ratio >= COVERAGE_SOFT_MID) return "medium";
  return "low";
}

export function coverageHintText(answered: number, total: number): string {
  return `Basierend auf ${answered} von ${total} Fragen`;
}

function scaleBucket<T extends string>(
  bucket: Record<T, number>,
  ids: readonly T[],
  factor: number,
): Record<T, number> {
  if (factor >= 1) return bucket;
  return Object.fromEntries(
    ids.map((id) => [id, clamp(bucket[id] * factor)]),
  ) as Record<T, number>;
}

/** Plain-German Zwischenprofile — no lone E/I letters. */
function zwischenLabels(axes: Record<AxisId, number>): string[] {
  return zwischenLabelsInWords(axes);
}

function axisPlainLine(id: AxisId, value: number): string {
  const meta = AXIS_PLAIN[id];
  if (Math.abs(value) < ZWISCHEN_THRESHOLD) {
    return `${meta.question}: gemischt — ${meta.low} und ${meta.high}`;
  }
  return value > 0
    ? `${meta.question}: eher ${meta.high}`
    : `${meta.question}: eher ${meta.low}`;
}

function toAxisScores(axes: Record<AxisId, number>): AxisScore[] {
  return AXIS_IDS.map((id) => ({
    id,
    value: axes[id],
    poleLow: AXIS_PLAIN[id].low,
    poleHigh: AXIS_PLAIN[id].high,
    plain: axisPlainLine(id, axes[id]),
  }));
}

function riasecCodeFrom(riasec: Record<RiasecId, number>): string {
  return [...RIASEC_IDS]
    .sort((a, b) => riasec[b] - riasec[a])
    .slice(0, 3)
    .join("");
}

function buildHowBullets(
  primary: VistProfile,
): { title: string; bullets: string[] }[] {
  return HOW_SECTIONS.map((key) => ({
    title: SECTION_LABELS[key] ?? key,
    bullets: (primary.sections[key] ?? []).slice(0, 3),
  })).filter((block) => block.bullets.length > 0);
}

function buildBlendBullets(
  profiles: VistProfile[],
  clusters: ClusterMatch[],
): string[] {
  const secondary = clusters.filter((c) => !c.isPrimary).slice(0, 2);
  const lines: string[] = [];
  for (const cluster of secondary) {
    const profile = profiles.find((p) => p.code === cluster.code);
    if (!profile) continue;
    const snippet =
      profile.sections.staerken?.[0] ??
      profile.sections.rolle_im_team?.[0] ??
      profile.sections.eigenschaften?.[0];
    if (!snippet) continue;
    const pct = Math.round(cluster.weight * 100);
    lines.push(`Vom Muster „${profile.role}“ (${pct}%): ${snippet}`);
  }
  return lines.slice(0, 3);
}

function plainSummary(
  primary: ClusterMatch,
  clusters: ClusterMatch[],
  zwischen: string[],
  riasecTop: string[],
  coverageHint: string,
  confidence: ConfidenceLevel,
): string[] {
  const lines = [
    `Dein Hauptmuster liegt bei „${primary.role}“.`,
  ];
  const secondary = clusters.filter((c) => !c.isPrimary).slice(0, 2);
  if (secondary.length) {
    lines.push(
      `Dazu passen auch: ${secondary
        .map((c) => c.role)
        .join(", ")}.`,
    );
  }
  if (zwischen.length) {
    lines.push(
      `Einige Bereiche sind gemischt (${zwischen.join(", ")}) — das ist normal.`,
    );
  }
  if (riasecTop.length) {
    lines.push(
      `Bei der Arbeit ziehen dich vor allem diese Felder an: ${riasecTop.join(", ")}.`,
    );
  }
  lines.push(`${coverageHint}.`);
  if (confidence === "low") {
    lines.push(
      "Wenige Antworten — das Ergebnis ist nur eine grobe Richtung.",
    );
  } else if (confidence === "medium") {
    lines.push(
      "Noch nicht alle Fragen beantwortet — die Richtung kann sich noch verschieben.",
    );
  }
  lines.push(
    "Hinweis: Das ist eine Orientierung — keine Diagnose.",
  );
  return lines;
}

/**
 * Pure scoring — pass profiles + occupation seeds so this can run in the browser
 * (answers live in sessionStorage; fs stays on the server page).
 */
export function scoreAssessment(
  items: AssessmentItem[],
  answers: Record<string, string>,
  profiles: VistProfile[],
  occupationSeeds: OccupationSeed[] = [],
): AssessmentResult {
  const axesRaw = emptyAxes();
  const axesCounts = emptyCounts(AXIS_IDS);
  const bigFiveRaw = emptyBigFive();
  const bigFiveCounts = emptyCounts(BIG_FIVE_IDS);
  const riasecRaw = emptyRiasec();
  const riasecCounts = emptyCounts(RIASEC_IDS);

  let answeredCount = 0;
  for (const item of items) {
    const choiceId = answers[item.id];
    if (!choiceId) continue;
    const choice = item.choices.find((c) => c.id === choiceId);
    if (!choice) continue;
    answeredCount += 1;
    applyWeights(
      axesRaw,
      axesCounts,
      bigFiveRaw,
      bigFiveCounts,
      riasecRaw,
      riasecCounts,
      choice.weights,
    );
  }

  const soft = coverageSoftFactor(answeredCount, items.length);
  const axes = scaleBucket(
    normalizeBucket(axesRaw, axesCounts, AXIS_IDS),
    AXIS_IDS,
    soft,
  );
  const bigFive = scaleBucket(
    normalizeBucket(bigFiveRaw, bigFiveCounts, BIG_FIVE_IDS),
    BIG_FIVE_IDS,
    soft,
  );
  const riasec = scaleBucket(
    normalizeBucket(riasecRaw, riasecCounts, RIASEC_IDS),
    RIASEC_IDS,
    soft,
  );

  const distances = profiles.map((p) => distance(axes, typeVector(p)));
  const weights = softMaxWeights(distances);

  const clusters: ClusterMatch[] = profiles
    .map((p, i) => ({
      code: p.code,
      role: p.role,
      weight: weights[i],
      isPrimary: false,
      isZwischen: false,
    }))
    .sort((a, b) => b.weight - a.weight);

  if (clusters[0]) clusters[0].isPrimary = true;
  const zwischen = zwischenLabels(axes);
  for (const c of clusters.slice(0, 3)) {
    c.isZwischen = zwischen.length > 0 && c.weight > 0.12 && !c.isPrimary;
  }

  const topClusters = clusters.slice(0, 5);
  const primaryCode = topClusters[0]?.code ?? "ENTJ";
  const primaryProfile =
    profiles.find((p) => p.code === primaryCode) ?? profiles[0];

  const riasecTop = [...RIASEC_IDS]
    .sort((a, b) => riasec[b] - riasec[a])
    .filter((id) => riasec[id] > 0)
    .slice(0, 2)
    .map((id) => RIASEC_LABELS[id]);

  const primaryCluster = topClusters[0] ?? {
    code: primaryCode,
    role: primaryProfile?.role ?? primaryCode,
    weight: 1,
    isPrimary: true,
    isZwischen: false,
  };

  const itemCount = items.length;
  const coverageRatio = itemCount > 0 ? answeredCount / itemCount : 0;
  const coverageHint = coverageHintText(answeredCount, itemCount);
  const coverageConfidence = confidenceFromCoverage(answeredCount, itemCount);
  const isIncomplete = answeredCount > 0 && answeredCount < itemCount;

  const axisScores = toAxisScores(axes);
  const occupations = matchOccupations(riasec, occupationSeeds, 3);
  const plainProfile = buildPlainProfile({
    primary: primaryCluster,
    clusters: topClusters,
    axes: axisScores,
    riasec,
    occupations,
    primaryProfile,
    zwischenLabels: zwischen,
  });

  const base: AssessmentResult = {
    answeredCount,
    itemCount,
    coverageRatio,
    coverageHint,
    confidence: coverageConfidence,
    isIncomplete,
    axes: axisScores,
    bigFive,
    riasec,
    riasecCode: riasecCodeFrom(riasec),
    clusters: topClusters,
    primaryCode,
    zwischenLabels: zwischen,
    plainSummary: plainSummary(
      primaryCluster,
      topClusters,
      zwischen,
      riasecTop,
      coverageHint,
      coverageConfidence,
    ),
    plainProfile,
    howBullets: primaryProfile ? buildHowBullets(primaryProfile) : [],
    blendBullets: buildBlendBullets(profiles, topClusters),
    occupations,
  };

  const analysis = analyzeResponsePattern(items, answers);
  const flags = buildBiasFlags(analysis);
  const guarded = applyBiasGuards(base, flags, analysis);
  // Keep plainProfile primary lines jargon-free even after bias prefaces.
  // Re-assert UX coverage fields so bias heuristics do not wipe them.
  return {
    ...guarded,
    coverageRatio,
    coverageHint,
    isIncomplete,
    plainProfile: {
      ...guarded.plainProfile,
      oneLine: guarded.plainProfile.oneLine,
      howYouWork: guarded.plainProfile.howYouWork,
      attractiveFields: guarded.plainProfile.attractiveFields,
      tips: guarded.plainProfile.tips,
    },
  };
}
