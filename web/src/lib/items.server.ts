import "server-only";

import { readFileSync } from "fs";
import path from "path";
import {
  resolveItemStimuli,
  sortAssessmentItems,
  type ResolvedAssessmentItem,
} from "./assessment/catalog";
import type { StimulusIndex } from "./stimuli";
import type { AssessmentItem } from "./types";

function dataPath(...parts: string[]) {
  return path.join(process.cwd(), "data", ...parts);
}

function loadStimulusIndex(): StimulusIndex {
  const file = dataPath("stimuli", "index.json");
  try {
    return JSON.parse(readFileSync(file, "utf8")) as StimulusIndex;
  } catch {
    return { version: 0, stimuli: [] };
  }
}

/** Server-only: load MVP items and resolve stimulus attribution. */
export function getMvpItems(): ResolvedAssessmentItem[] {
  const file = dataPath("items", "mvp-pictorial.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    items: AssessmentItem[];
  };
  const sorted = sortAssessmentItems(data.items);
  return resolveItemStimuli(sorted, loadStimulusIndex());
}

/** Raw items without stimulus enrichment (tests / tooling). */
export function getMvpItemsRaw(): AssessmentItem[] {
  const file = dataPath("items", "mvp-pictorial.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    items: AssessmentItem[];
  };
  return sortAssessmentItems(data.items);
}
