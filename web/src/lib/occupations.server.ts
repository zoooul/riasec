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
 * Prefer trimmed O*NET/ESCO set (`occupations.json`); fall back to `seed.json`.
 */
export function getOccupationSeeds(): OccupationSeed[] {
  const primary = dataPath("occupations.json");
  if (existsSync(primary)) {
    const rows = readOccupationsFile(primary);
    if (rows.length) return rows;
  }
  return readOccupationsFile(dataPath("seed.json"));
}
