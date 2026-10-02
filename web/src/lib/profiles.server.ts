import "server-only";

import { readFileSync } from "fs";
import path from "path";
import { SECTION_LABELS } from "./constants";
import type { VistProfile } from "./types";

export { SECTION_LABELS };

const profilesDir = path.join(process.cwd(), "data", "profiles");

export function listProfileCodes(): string[] {
  const index = JSON.parse(
    readFileSync(path.join(profilesDir, "index.json"), "utf8"),
  ) as { profiles: { code: string }[] };
  return index.profiles.map((p) => p.code);
}

export function getProfile(code: string): VistProfile {
  const file = path.join(profilesDir, `${code.toLowerCase()}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as VistProfile;
}

export function getAllProfiles(): VistProfile[] {
  return listProfileCodes().map(getProfile);
}
