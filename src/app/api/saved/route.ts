import { NextResponse } from "next/server";

// SavedCollege model was removed — use /api/shortlist instead.
export async function GET() {
  return NextResponse.redirect(new URL("/api/shortlist", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
}
