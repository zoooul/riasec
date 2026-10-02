import type { LicenseLayer, ValidationStatus } from "./types";

/** Registry entry for a pictorial / affective stimulus. */
export interface StimulusEntry {
  id: string;
  motif: string;
  kind: "pattern" | "scene" | "affect";
  sourceId: string;
  license: string;
  layer: LicenseLayer;
  attribution: string;
  validationStatus?: ValidationStatus;
  /** Optional path under /public or external URL once assets land. */
  assetPath?: string;
}

export interface StimulusIndex {
  version: number;
  stimuli: StimulusEntry[];
}

/** Resolve a motif against the stimulus registry (falls back to motif id). */
export function resolveStimulus(
  motif: string,
  index: StimulusIndex | StimulusEntry[],
): StimulusEntry | null {
  const list = Array.isArray(index) ? index : index.stimuli;
  return list.find((s) => s.motif === motif || s.id === motif) ?? null;
}

export function indexStimuliByMotif(
  index: StimulusIndex | StimulusEntry[],
): Map<string, StimulusEntry> {
  const list = Array.isArray(index) ? index : index.stimuli;
  return new Map(list.map((s) => [s.motif, s]));
}
