import "server-only";

import { readFileSync } from "fs";
import path from "path";
import type { LicenseLayer } from "./types";

export interface LicenseSource {
  id: string;
  name: string;
  url: string;
  license: string;
  layer: LicenseLayer | "owned";
  commercial: string;
  modules: string[];
  notes: string;
}

export interface LicenseRegister {
  policy: {
    mode: string;
    preference: string;
    frontendRule: string;
  };
  layers: Record<string, string>;
  sources: LicenseSource[];
}

export function getLicenseRegister(): LicenseRegister {
  const file = path.join(process.cwd(), "data", "licenses", "sources.json");
  return JSON.parse(readFileSync(file, "utf8")) as LicenseRegister;
}

/** Compact attribution lines for UI footer (core + owned by default). */
export function getAttributionLines(
  layers: Array<LicenseLayer | "owned"> = ["core", "owned"],
): { id: string; name: string; license: string; url: string }[] {
  const register = getLicenseRegister();
  return register.sources
    .filter((s) => layers.includes(s.layer as LicenseLayer | "owned"))
    .map((s) => ({
      id: s.id,
      name: s.name,
      license: s.license,
      url: s.url,
    }));
}
