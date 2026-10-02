import { readFileSync } from "fs";
import path from "path";
import type { AssessmentItem } from "./types";

export function getMvpItems(): AssessmentItem[] {
  const file = path.join(process.cwd(), "data", "items", "mvp-pictorial.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    items: AssessmentItem[];
  };
  return data.items;
}
