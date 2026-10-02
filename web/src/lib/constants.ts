import type { AxisId, BigFiveId, ModuleId, RiasecId } from "./types";

export const AXIS_IDS: AxisId[] = ["E_I", "S_N", "T_F", "J_P"];
export const BIG_FIVE_IDS: BigFiveId[] = ["O", "C", "E", "A", "N"];
export const RIASEC_IDS: RiasecId[] = ["R", "I", "A", "S", "E", "C"];

export const ZWISCHEN_THRESHOLD = 18;

/** Soft-score dampening when coverage is thin. */
export const COVERAGE_SOFT_HIGH = 0.75;
export const COVERAGE_SOFT_MID = 0.4;

export const MODULE_ORDER: ModuleId[] = [
  "personality",
  "interests",
  "self_regulation",
  "motives",
];

export const MODULE_LABELS: Record<ModuleId, string> = {
  personality: "So tickst du",
  interests: "Was dich anzieht",
  self_regulation: "Unter Druck",
  motives: "Was dich antreibt",
};

export const AXIS_PLAIN: Record<
  AxisId,
  { low: string; high: string; question: string }
> = {
  E_I: {
    low: "eher für dich",
    high: "eher mit anderen",
    question: "Energie",
  },
  S_N: {
    low: "Details & Genauigkeit",
    high: "Muster & Möglichkeiten",
    question: "Blick",
  },
  T_F: {
    low: "Fakten & Logik",
    high: "Menschen & Werte",
    question: "Entscheidung",
  },
  J_P: {
    low: "Plan & Abschluss",
    high: "Flexibel & offen",
    question: "Arbeitsstil",
  },
};

export const RIASEC_LABELS: Record<RiasecId, string> = {
  R: "Praktisch-handwerklich",
  I: "Untersuchend",
  A: "Gestalterisch",
  S: "Sozial-begleitend",
  E: "Unternehmerisch",
  C: "Ordnend-strukturierend",
};

export const SECTION_LABELS: Record<string, string> = {
  eigenschaften: "Typische Stärken im Auftreten",
  staerken: "Was dir leichtfällt",
  schwaechen: "Worauf du achten kannst",
  motivation: "Was dich antreibt",
  demotivation: "Was dich ausbremst",
  konflikt_positiv: "Im Konflikt — hilfreich",
  konflikt_negativ: "Im Konflikt — schwierig",
  rollen_berufe: "Passende Rollen",
  rolle_im_team: "Im Team",
  idealer_chef: "Dein idealer Chef",
  verhalten_als_chef: "Wenn du führst",
  kommunikation_sollten: "So solltest du angesprochen werden",
  kommunikation_vermeiden: "Das eher vermeiden",
  stress: "Unter Stress",
  lernen: "So lernst du gut",
  entwicklungspotential: "Entwicklung",
  talente_organisation: "Talente in Organisationen",
};

export const HOW_SECTIONS = [
  "staerken",
  "motivation",
  "rolle_im_team",
  "stress",
] as const;

export const SESSION_ANSWERS_KEY = "skillster.answers.v1";
