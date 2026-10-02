/**
 * Client-safe assessment surface.
 * Server loaders live in `*.server.ts` and must not be imported here.
 */
export { scoreAssessment } from "../scoring";
export {
  loadAnswers,
  saveAnswers,
  clearAnswers,
  countValidAnswers,
  resumeIndex,
  hasPartialProgress,
  getAnswersSnapshot,
  getServerAnswersSnapshot,
  SESSION_ANSWERS_KEY,
} from "../session";
export { matchOccupations, type OccupationSeed } from "../occupations";
export {
  sortAssessmentItems,
  validateItemCatalog,
  resolveItemStimuli,
  type CatalogIssue,
  type ResolvedAssessmentItem,
} from "./catalog";
export {
  MODULE_ORDER,
  MODULE_LABELS,
  MODULE_INTROS,
  ITEM_SEQUENCE,
  computeProgress,
  moduleCoverageMatrix,
  analyzeStructureIntegrity,
  orderAssessmentItems,
} from "../assessmentStructure";
export type {
  AssessmentItem,
  AssessmentResult,
  ChoiceWeights,
  OccupationMatch,
  VistProfile,
} from "../types";
