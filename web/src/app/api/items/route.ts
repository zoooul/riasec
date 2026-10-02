import { NextResponse } from "next/server";
import { getMvpItems } from "@/lib/items.server";

/**
 * Catalog meta for the pictorial MVP set.
 * Omits full weight payloads — clients that need scoring use POST /api/score
 * or the bundled client `scoreAssessment` path on /ergebnis.
 */
export async function GET() {
  const items = getMvpItems();
  const modules = Array.from(new Set(items.map((i) => i.module)));

  return NextResponse.json({
    version: 1,
    count: items.length,
    modules,
    items: items.map((item) => ({
      id: item.id,
      module: item.module,
      prompt: item.prompt,
      helpText: item.helpText ?? null,
      choiceCount: item.choices.length,
      choices: item.choices.map((c) => ({
        id: c.id,
        label: c.label,
        hint: c.hint,
        visual: c.visual,
      })),
      validationStatus: item.source.validationStatus,
      layer: item.source.layer,
    })),
  });
}
