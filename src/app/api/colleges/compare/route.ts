import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/colleges/compare?ids=slug1,slug2,slug3
export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3); // max 3

    if (ids.length < 2) {
      return NextResponse.json(
        { error: "Provide at least 2 college ids or slugs" },
        { status: 400 }
      );
    }

    const colleges = await prisma.college.findMany({
      where: { OR: ids.flatMap((id) => [{ id }, { slug: id }]) },
      include: {
        courseFees:      { orderBy: { annualFee: "asc" } },
        placementStats:  { orderBy: { year: "desc" }, take: 1 },
        admissionCutoffs: {
          orderBy: [{ year: "desc" }],
          take: 6, // latest cutoffs
        },
        reviews: {
          where: { status: "APPROVED" },
          select: {
            ratingOverall:   true,
            ratingPlacement: true,
            ratingFaculty:   true,
            ratingInfra:     true,
          },
        },
      },
    });

    if (colleges.length === 0) {
      return NextResponse.json({ error: "No colleges found" }, { status: 404 });
    }

    // Build normalised comparison objects
    const compared = colleges.map((c) => {
      const latestPlacement = c.placementStats[0];
      const minFee = c.courseFees[0]?.annualFee ?? null;
      const reviewCount = c.reviews.length;
      const avgRating =
        reviewCount > 0
          ? round(
              c.reviews.reduce((sum, r) => sum + r.ratingOverall, 0) /
                reviewCount
            )
          : null;

      return {
        id:            c.id,
        slug:          c.slug,
        name:          c.name,
        city:          c.city,
        state:         c.state,
        type:          c.type,
        streams:       c.streams,
        nirfRank:      c.nirfRank,
        established:   c.established,
        accreditation: c.accreditation,
        minAnnualFee:  minFee,
        allFees:       c.courseFees.map((f) => ({
          course:    f.course,
          degree:    f.degree,
          annualFee: f.annualFee,
        })),
        placement: latestPlacement
          ? {
              year:          latestPlacement.year,
              avgPackage:    latestPlacement.avgPackage,
              maxPackage:    latestPlacement.maxPackage,
              placementPct:  latestPlacement.placementPct,
              topRecruiters: latestPlacement.topRecruiters,
            }
          : null,
        cutoffs: c.admissionCutoffs.map((co) => ({
          exam:         co.exam,
          year:         co.year,
          category:     co.category,
          cutoffValue:  co.cutoffValue,
        })),
        avgRating,
        reviewCount,
      };
    });

    return NextResponse.json({ colleges: compared });
  } catch (error) {
    console.error("[GET /api/colleges/compare]", error);
    return NextResponse.json(
      { error: "Failed to fetch comparison" },
      { status: 500 }
    );
  }
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
