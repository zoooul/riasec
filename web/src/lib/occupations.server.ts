import { readFileSync } from "fs";
import path from "path";
import type { OccupationSeed } from "./occupations";

/** Server-only loader for occupation seed JSON. */
export function getOccupationSeeds(): OccupationSeed[] {
  const file = path.join(process.cwd(), "data", "occupations", "seed.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    occupations: OccupationSeed[];
  };
  return data.occupations;
}
