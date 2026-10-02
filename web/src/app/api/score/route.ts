import { NextResponse } from "next/server";
import { getMvpItems } from "@/lib/items.server";
import { getOccupationSeeds } from "@/lib/occupations.server";
import { getAllProfiles } from "@/lib/profiles.server";
import { scoreAssessment } from "@/lib/scoring";

type ScoreBody = {
  answers?: Record<string, string>;
};

const MAX_ANSWER_ENTRIES = 256;
const MAX_KEY_LEN = 128;
const MAX_VALUE_LEN = 128;

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

  const entries = Object.entries(body.answers);
  if (entries.length > MAX_ANSWER_ENTRIES) {
    return NextResponse.json(
      { error: `Too many answers (max ${MAX_ANSWER_ENTRIES}).` },
      { status: 400 },
    );
  }

  const answers: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (typeof key !== "string" || !key || key.length > MAX_KEY_LEN) continue;
    if (typeof value !== "string" || !value || value.length > MAX_VALUE_LEN) {
      continue;
    }
    answers[key] = value;
  }

  const items = getMvpItems();
  const profiles = getAllProfiles();
  const occupations = getOccupationSeeds();
  const result = scoreAssessment(items, answers, profiles, occupations);

  return NextResponse.json({
    result,
    meta: {
      acceptedAnswers: Object.keys(answers).length,
      itemCount: items.length,
      answeredCount: result.answeredCount,
      isIncomplete: result.isIncomplete,
    },
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with { answers }." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
