import { RIASEC_IDS, RIASEC_LABELS } from "./constants";
import type { OccupationMatch, RiasecId } from "./types";

export interface OccupationSeed {
  id: string;
  titleDe: string;
  riasec: string;
  vector: Record<RiasecId, number>;
  titleEn?: string;
  onetSoc?: string;
  source?: string;
}

function cosine(
  a: Record<RiasecId, number>,
  b: Record<RiasecId, number>,
): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const id of RIASEC_IDS) {
    const av = a[id] ?? 0;
    const bv = b[id] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function whyMatch(
  user: Record<RiasecId, number>,
  seed: OccupationSeed,
): string {
  const shared = [...RIASEC_IDS]
    .map((id) => ({
      id,
      score: Math.min(Math.max(user[id], 0), 100) * (seed.vector[id] ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score > 0)
    .slice(0, 2)
    .map((x) => RIASEC_LABELS[x.id].toLowerCase());

  if (shared.length === 0) {
    return `Passt grob zum Interessenmuster ${seed.riasec}.`;
  }
  return `Passt zu deinem Hang zu ${shared.join(" und ")}.`;
}

export function matchOccupations(
  riasec: Record<RiasecId, number>,
  seeds: OccupationSeed[],
  limit = 6,
): OccupationMatch[] {
  return seeds
    .map((seed) => ({
      id: seed.id,
      titleDe: seed.titleDe,
      riasec: seed.riasec,
      score: cosine(riasec, seed.vector),
      why: whyMatch(riasec, seed),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
