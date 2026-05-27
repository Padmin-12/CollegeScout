import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/shortlist/colleges — full college data for the user's shortlist
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shortlists = await prisma.shortlist.findMany({
      where: { userId: session.user.id },
      include: {
        college: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            state: true,
            type: true,
            nirfRank: true,
            courseFees: { select: { annualFee: true } },
            placementStats: {
              orderBy: { year: "desc" },
              take: 1,
              select: { avgPackage: true, maxPackage: true, placementPct: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const colleges = shortlists.map(({ college }) => ({
      id: college.id,
      slug: college.slug,
      name: college.name,
      city: college.city,
      state: college.state,
      type: college.type,
      nirfRank: college.nirfRank,
      avgPackage: college.placementStats[0]?.avgPackage ?? null,
      maxPackage: college.placementStats[0]?.maxPackage ?? null,
      placementPct: college.placementStats[0]?.placementPct ?? null,
      minFee: college.courseFees.length > 0
        ? Math.min(...college.courseFees.map((f) => f.annualFee))
        : null,
    }));

    return NextResponse.json({ colleges });
  } catch (error) {
    console.error("[GET /api/shortlist/colleges]", error);
    return NextResponse.json({ error: "Failed to fetch shortlist" }, { status: 500 });
  }
}
