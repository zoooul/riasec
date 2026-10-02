import { getAllProfiles } from "./profiles";
import type {
  AssessmentItem,
  AssessmentResult,
  AxisId,
  BigFiveId,
  ClusterMatch,
  RiasecId,
  VistProfile,
} from "./types";

const AXIS_IDS: AxisId[] = ["E_I", "S_N", "T_F", "J_P"];
const BIG_FIVE: BigFiveId[] = ["O", "C", "E", "A", "N"];
const RIASEC: RiasecId[] = ["R", "I", "A", "S", "E", "C"];

const ZWISCHEN_THRESHOLD = 18;

function clamp(n: number, min = -100, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function emptyScores() {
  const scores: Record<string, number> = {};
  for (const id of [...AXIS_IDS, ...BIG_FIVE, ...RIASEC]) scores[id] = 0;
  return scores;
}

/** Map continuous VIST axes to distance against a 16-type pole vector. */
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

function zwischenLabels(axes: Record<AxisId, number>): string[] {
  const labels: string[] = [];
  const pairs: [AxisId, string, string][] = [
    ["E_I", "E", "I"],
    ["S_N", "N", "S"],
    ["T_F", "F", "T"],
    ["J_P", "P", "J"],
  ];
  for (const [id, high, low] of pairs) {
    if (Math.abs(axes[id]) < ZWISCHEN_THRESHOLD) {
      labels.push(`zwischen ${high} und ${low}`);
    }
  }
  return labels;
}

function plainSummary(
  primary: ClusterMatch,
  clusters: ClusterMatch[],
  zwischen: string[],
  riasecTop: string[],
): string[] {
  const lines = [
    `Dein Hauptmuster liegt bei „${primary.role}“ (${primary.code}).`,
  ];
  const secondary = clusters.filter((c) => !c.isPrimary).slice(0, 2);
  if (secondary.length) {
    lines.push(
      `Dazu passen auch: ${secondary
        .map((c) => `${c.role} (${Math.round(c.weight * 100)}%)`)
        .join(", ")}.`,
    );
  }
  if (zwischen.length) {
    lines.push(
      `Einige Bereiche sind gemischt (${zwischen.join(", ")}) — das ist normal und macht dein Profil lebendiger.`,
    );
  }
  if (riasecTop.length) {
    lines.push(
      `Bei der Arbeit ziehen dich vor allem diese Felder an: ${riasecTop.join(", ")}.`,
    );
  }
  lines.push(
    "Hinweis: Dieses Ergebnis ist ein erster Orientierungstest und noch nicht normiert.",
  );
  return lines;
}

const RIASEC_LABELS: Record<RiasecId, string> = {
  R: "Praktisch-handwerklich",
  I: "Untersuchend",
  A: "Gestalterisch",
  S: "Sozial-begleitend",
  E: "Unternehmerisch",
  C: "Ordnend-strukturierend",
};

export function scoreAssessment(
  items: AssessmentItem[],
  answers: Record<string, string>,
): AssessmentResult {
  const raw = emptyScores();
  for (const item of items) {
    const choiceId = answers[item.id];
    if (!choiceId) continue;
    const choice = item.choices.find((c) => c.id === choiceId);
    if (!choice) continue;
    for (const [key, value] of Object.entries(choice.weights)) {
      raw[key] = (raw[key] ?? 0) + (value ?? 0);
    }
  }

  const axes = Object.fromEntries(
    AXIS_IDS.map((id) => [id, clamp(raw[id])]),
  ) as Record<AxisId, number>;

  const bigFive = Object.fromEntries(
    BIG_FIVE.map((id) => [id, clamp(raw[id])]),
  ) as Record<BigFiveId, number>;

  const riasec = Object.fromEntries(
    RIASEC.map((id) => [id, clamp(raw[id])]),
  ) as Record<RiasecId, number>;

  const profiles = getAllProfiles();
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

  const riasecTop = [...RIASEC]
    .sort((a, b) => riasec[b] - riasec[a])
    .filter((id) => riasec[id] > 0)
    .slice(0, 2)
    .map((id) => RIASEC_LABELS[id]);

  return {
    axes: AXIS_IDS.map((id) => ({ id, value: axes[id] })),
    bigFive,
    riasec,
    clusters: clusters.slice(0, 5),
    primaryCode: clusters[0]?.code ?? "ENTJ",
    zwischenLabels: zwischen,
    plainSummary: plainSummary(
      clusters[0],
      clusters,
      zwischen,
      riasecTop,
    ),
  };
}
