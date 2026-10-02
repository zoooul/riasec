import { NextResponse } from "next/server";

/** Liveness probe — no secrets, no side effects. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "skillster",
    version: "0.1.0",
    ts: new Date().toISOString(),
  });
}
