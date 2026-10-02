import { orderAssessmentItems } from "../assessmentStructure";
import { indexStimuliByMotif, type StimulusIndex } from "../stimuli";
import type { AssessmentItem, ChoiceWeights } from "../types";

export type ResolvedChoice = AssessmentItem["choices"][number] & {
  stimulusId?: string;
  stimulusAttribution?: string;
};

export type ResolvedAssessmentItem = Omit<AssessmentItem, "choices"> & {
  choices: ResolvedChoice[];
};

/** Sort items by canonical assessment sequence (stages + psychometrics). */
export function sortAssessmentItems(items: AssessmentItem[]): AssessmentItem[] {
  return orderAssessmentItems(items);
}

function hasNestedWeights(weights: ChoiceWeights): boolean {
  const axes = weights.axes && Object.keys(weights.axes).length > 0;
  const bigFive = weights.bigFive && Object.keys(weights.bigFive).length > 0;
  const riasec = weights.riasec && Object.keys(weights.riasec).length > 0;
  return Boolean(axes || bigFive || riasec);
}

export interface CatalogIssue {
  level: "error" | "warn";
  message: string;
}

/** Integrity checks for the assessment item catalog. */
export function validateItemCatalog(items: AssessmentItem[]): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const itemIds = new Set<string>();
  const choiceIds = new Set<string>();

  for (const item of items) {
    if (itemIds.has(item.id)) {
      issues.push({ level: "error", message: `Duplicate item id: ${item.id}` });
    }
    itemIds.add(item.id);

    if (!item.choices?.length) {
      issues.push({
        level: "error",
        message: `Item ${item.id} has no choices`,
      });
    }

    for (const choice of item.choices ?? []) {
      if (choiceIds.has(choice.id)) {
        issues.push({
          level: "error",
          message: `Duplicate choice id: ${choice.id}`,
        });
      }
      choiceIds.add(choice.id);

      if (!choice.weights || !hasNestedWeights(choice.weights)) {
        issues.push({
          level: "error",
          message: `Choice ${choice.id} missing nested weights`,
        });
      }
    }
  }

  return issues;
}

/**
 * Attach stimulus registry metadata to choices by visual.motif.
 * Pure — safe in tests and (if needed) on the client with a passed index.
 */
export function resolveItemStimuli(
  items: AssessmentItem[],
  stimulusIndex: StimulusIndex,
): ResolvedAssessmentItem[] {
  const byMotif = indexStimuliByMotif(stimulusIndex);
  return items.map((item) => ({
    ...item,
    choices: item.choices.map((choice) => {
      const stimulus = byMotif.get(choice.visual.motif);
      if (!stimulus) return { ...choice };
      return {
        ...choice,
        stimulusId: stimulus.id,
        stimulusAttribution: stimulus.attribution,
        visual: {
          ...choice.visual,
          imageUrl: stimulus.assetPath ?? choice.visual.imageUrl,
        },
      };
    }),
  }));
}
