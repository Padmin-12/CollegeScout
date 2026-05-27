import { NextResponse } from "next/server";

// This route is deprecated — shortlist is now user-authenticated, not session-based.
// Kept as a stub to avoid 404s from any cached references.
export async function GET() {
  return NextResponse.json({ error: "This endpoint is deprecated. Use /api/shortlist instead." }, { status: 410 });
}
