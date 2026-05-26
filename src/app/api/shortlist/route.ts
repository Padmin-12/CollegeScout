import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Helper: read sessionId from header OR body
function getSessionId(req: NextRequest, body?: Record<string, unknown>): string | null {
  return (
    req.headers.get("x-session-id") ??
    (typeof body?.sessionId === "string" ? body.sessionId : null)
  );
}

// ── GET /api/shortlist — retrieve all shortlisted colleges for a session ─────

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.headers.get("x-session-id");
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId required in x-session-id header" },
        { status: 400 }
      );
    }

    const shortlists = await prisma.shortlist.findMany({
      where: { sessionId },
      select: { collegeId: true },
    });

    return NextResponse.json(shortlists);
  } catch (error) {
    console.error("[GET /api/shortlist]", error);
    return NextResponse.json({ error: "Failed to fetch shortlist" }, { status: 500 });
  }
}

// ── POST /api/shortlist — add a college to anonymous shortlist ─────────────

const ShortlistBodySchema = z.object({
  collegeId: z.string().min(1, "collegeId is required"),
  sessionId: z.string().optional(), // optional if provided via header
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json() as Record<string, unknown>;
    const parsed  = ShortlistBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const sessionId = getSessionId(req, rawBody);
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId required — pass in x-session-id header or request body" },
        { status: 400 }
      );
    }

    const { collegeId } = parsed.data;

    // Verify college exists
    const college = await prisma.college.findUnique({
      where:  { id: collegeId },
      select: { id: true, name: true, slug: true },
    });
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // Upsert — idempotent
    const shortlist = await prisma.shortlist.upsert({
      where:  { sessionId_collegeId: { sessionId, collegeId } },
      update: {},
      create: { sessionId, collegeId },
    });

    return NextResponse.json(shortlist, { status: 201 });
  } catch (error) {
    console.error("[POST /api/shortlist]", error);
    return NextResponse.json({ error: "Failed to shortlist" }, { status: 500 });
  }
}

// ── DELETE /api/shortlist — remove a college from shortlist ────────────────

export async function DELETE(req: NextRequest) {
  try {
    const rawBody   = await req.json() as Record<string, unknown>;
    const sessionId = getSessionId(req, rawBody);
    const collegeId = typeof rawBody.collegeId === "string" ? rawBody.collegeId : null;

    if (!sessionId || !collegeId) {
      return NextResponse.json(
        { error: "sessionId (header or body) and collegeId are required" },
        { status: 400 }
      );
    }

    await prisma.shortlist.deleteMany({ where: { sessionId, collegeId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/shortlist]", error);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}