export type LicenseLayer = "core" | "extra" | "owned";

export type AxisId = "E_I" | "S_N" | "T_F" | "J_P";
export type BigFiveId = "O" | "C" | "E" | "A" | "N";
export type RiasecId = "R" | "I" | "A" | "S" | "E" | "C";
export type ModuleId =
  | "personality"
  | "interests"
  | "motives"
  | "self_regulation";

export type ValidationStatus = "validated" | "unvalidated" | "enrichment";

export interface SourceRef {
  sourceId: string;
  license: string;
  layer: LicenseLayer;
  changeStatus: "verbatim" | "adapted" | "own_construction";
  validationStatus: ValidationStatus;
}

export interface ProfileSectionMap {
  [key: string]: string[];
}

export interface VistProfile {
  code: string;
  role: string;
  system: string;
  source: {
    file: string;
    licenseLayer: LicenseLayer | "owned";
    notes: string;
  };
  dimensions: Record<AxisId, string>;
  sections: ProfileSectionMap;
}

/** Nested weights avoid Big-Five E vs RIASEC E collision. */
export interface ChoiceWeights {
  axes?: Partial<Record<AxisId, number>>;
  bigFive?: Partial<Record<BigFiveId, number>>;
  riasec?: Partial<Record<RiasecId, number>>;
}

export interface PictorialChoice {
  id: string;
  label: string;
  hint: string;
  visual: {
    kind: "pattern" | "scene" | "affect";
    motif: string;
    /** Catalog asset path under /public or absolute URL when present. */
    imageUrl?: string;
  };
  weights: ChoiceWeights;
}

export interface AssessmentItem {
  id: string;
  module: ModuleId;
  prompt: string;
  helpText?: string;
  choices: PictorialChoice[];
  source: SourceRef;
}

export interface AxisScore {
  id: AxisId;
  value: number;
  poleLow: string;
  poleHigh: string;
  plain: string;
}

export interface ClusterMatch {
  code: string;
  role: string;
  weight: number;
  isPrimary: boolean;
  isZwischen: boolean;
}

export interface OccupationMatch {
  id: string;
  titleDe: string;
  riasec: string;
  score: number;
  why: string;
}

export interface AssessmentResult {
  answeredCount: number;
  itemCount: number;
  axes: AxisScore[];
  bigFive: Record<BigFiveId, number>;
  riasec: Record<RiasecId, number>;
  riasecCode: string;
  clusters: ClusterMatch[];
  primaryCode: string;
  zwischenLabels: string[];
  plainSummary: string[];
  howBullets: { title: string; bullets: string[] }[];
  blendBullets: string[];
  occupations: OccupationMatch[];
}
