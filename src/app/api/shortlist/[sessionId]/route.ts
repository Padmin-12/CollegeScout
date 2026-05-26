import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/shortlist/[sessionId] — get all shortlisted colleges for a session

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const entries = await prisma.shortlist.findMany({
      where:   { sessionId },
      orderBy: { createdAt: "desc" },
      include: {
        college: {
          select: {
            id:       true,
            slug:     true,
            name:     true,
            city:     true,
            state:    true,
            type:     true,
            streams:  true,
            nirfRank: true,
            placementStats: {
              orderBy: { year: "desc" },
              take:    1,
              select:  { avgPackage: true, maxPackage: true, placementPct: true },
            },
            courseFees: {
              orderBy: { annualFee: "asc" },
              take:    1,
              select:  { annualFee: true },
            },
          },
        },
      },
    });

    const colleges = entries.map((e) => ({
      shortlistId: e.id,
      addedAt:     e.createdAt,
      ...e.college,
      avgPackage:  e.college.placementStats[0]?.avgPackage ?? null,
      maxPackage:  e.college.placementStats[0]?.maxPackage ?? null,
      placementPct: e.college.placementStats[0]?.placementPct ?? null,
      minFee:       e.college.courseFees[0]?.annualFee ?? null,
    }));

    return NextResponse.json({ sessionId, colleges, total: colleges.length });
  } catch (error) {
    console.error("[GET /api/shortlist/[sessionId]]", error);
    return NextResponse.json({ error: "Failed to fetch shortlist" }, { status: 500 });
  }
}
