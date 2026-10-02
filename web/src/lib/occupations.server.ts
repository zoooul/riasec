import "server-only";

import { readFileSync, existsSync } from "fs";
import path from "path";
import type { OccupationSeed } from "./occupations";

function dataPath(...parts: string[]) {
  return path.join(process.cwd(), "data", "occupations", ...parts);
}

function readOccupationsFile(file: string): OccupationSeed[] {
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    occupations: OccupationSeed[];
  };
  return data.occupations ?? [];
}

/**
 * Prefer trimmed O*NET set (`occupations.json` from import script);
 * fall back to `imported.json` then `seed.json`.
 */
export function getOccupationSeeds(): OccupationSeed[] {
  for (const name of ["occupations.json", "imported.json", "seed.json"]) {
    const file = dataPath(name);
    if (!existsSync(file)) continue;
    const rows = readOccupationsFile(file);
    if (rows.length) return rows;
  }
  return [];
}
