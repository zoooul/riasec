import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AssessmentItem, VistProfile } from "@/lib/types";
import type { OccupationSeed } from "@/lib/occupations";
import type { StimulusIndex } from "@/lib/stimuli";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export function loadMvpItems(): AssessmentItem[] {
  const file = path.join(webRoot, "data", "items", "mvp-pictorial.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as { items: AssessmentItem[] };
  return data.items;
}

export function loadOccupationSeeds(): OccupationSeed[] {
  const file = path.join(webRoot, "data", "occupations", "seed.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    occupations: OccupationSeed[];
  };
  return data.occupations;
}

export function loadStimulusIndex(): StimulusIndex {
  const file = path.join(webRoot, "data", "stimuli", "index.json");
  return JSON.parse(readFileSync(file, "utf8")) as StimulusIndex;
}

export function loadAllProfiles(): VistProfile[] {
  const indexPath = path.join(webRoot, "data", "profiles", "index.json");
  const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
    profiles: { code: string; file: string }[];
  };
  return index.profiles.map((p) => {
    const file = path.join(webRoot, "data", "profiles", p.file);
    return JSON.parse(readFileSync(file, "utf8")) as VistProfile;
  });
}

/** Pick first choice for every item (deterministic full answer set). */
export function firstChoiceAnswers(items: AssessmentItem[]): Record<string, string> {
  return Object.fromEntries(
    items.map((item) => [item.id, item.choices[0]!.id]),
  );
}
