import { readFileSync } from "fs";
import path from "path";
import type { VistProfile } from "./types";

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

/** Plain-language section labels for the result UI */
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
