import { readFileSync } from "fs";
import path from "path";
import { MODULE_ORDER } from "./constants";
import type { AssessmentItem } from "./types";

export function getMvpItems(): AssessmentItem[] {
  const file = path.join(process.cwd(), "data", "items", "mvp-pictorial.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    items: AssessmentItem[];
  };
  const order = new Map(MODULE_ORDER.map((m, i) => [m, i]));
  return [...data.items].sort((a, b) => {
    const ma = order.get(a.module) ?? 99;
    const mb = order.get(b.module) ?? 99;
    if (ma !== mb) return ma - mb;
    return a.id.localeCompare(b.id);
  });
}
