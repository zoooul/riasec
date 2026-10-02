export type LicenseLayer = "core" | "extra" | "owned";

export type AxisId = "E_I" | "S_N" | "T_F" | "J_P";
export type BigFiveId = "O" | "C" | "E" | "A" | "N";
export type RiasecId = "R" | "I" | "A" | "S" | "E" | "C";

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

export interface PictorialChoice {
  id: string;
  label: string;
  /** Short plain-language description shown under the choice */
  hint: string;
  /** Visual placeholder until real stimuli are wired */
  visual: {
    kind: "pattern" | "scene" | "affect";
    motif: string;
  };
  weights: Partial<Record<AxisId | BigFiveId | RiasecId, number>>;
}

export interface AssessmentItem {
  id: string;
  module: "personality" | "interests" | "motives" | "self_regulation";
  prompt: string;
  helpText?: string;
  choices: PictorialChoice[];
  source: SourceRef;
}

export interface AxisScore {
  id: AxisId | BigFiveId | RiasecId;
  value: number; // -100 .. +100
}

export interface ClusterMatch {
  code: string;
  role: string;
  weight: number; // 0..1
  isPrimary: boolean;
  isZwischen: boolean;
}

export interface AssessmentResult {
  axes: AxisScore[];
  bigFive: Record<BigFiveId, number>;
  riasec: Record<RiasecId, number>;
  clusters: ClusterMatch[];
  primaryCode: string;
  zwischenLabels: string[];
  plainSummary: string[];
}
