import { NextResponse } from "next/server";
import { getMvpItems } from "@/lib/items.server";
import { getOccupationSeeds } from "@/lib/occupations.server";
import { getAllProfiles } from "@/lib/profiles.server";
import { scoreAssessment } from "@/lib/scoring";

type ScoreBody = {
  answers?: Record<string, string>;
};

/**
 * Server-side scoring for clearer FE/BE separation and testability.
 * The Ergebnis UI still scores client-side (offline + no round-trip);
 * this route mirrors the same pure `scoreAssessment` function.
 */
export async function POST(request: Request) {
  let body: ScoreBody;
  try {
    body = (await request.json()) as ScoreBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected { answers: Record<string, string> }." },
      { status: 400 },
    );
  }

  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
    return NextResponse.json(
      { error: "Body must include answers: Record<itemId, choiceId>." },
      { status: 400 },
    );
  }

  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.answers)) {
    if (typeof value === "string") answers[key] = value;
  }

  const items = getMvpItems();
  const profiles = getAllProfiles();
  const occupations = getOccupationSeeds();
  const result = scoreAssessment(items, answers, profiles, occupations);

  return NextResponse.json({ result });
}
