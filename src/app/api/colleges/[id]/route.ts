import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/colleges/[id]  — accepts either cuid id OR slug
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try slug first, then id
    const college = await prisma.college.findFirst({
      where: { OR: [{ slug: id }, { id }] },
      include: {
        courseFees: {
          orderBy: { annualFee: "asc" },
        },
        placementStats: {
          orderBy: { year: "desc" },
        },
        admissionCutoffs: {
          orderBy: [{ year: "desc" }, { exam: "asc" }, { category: "asc" }],
        },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // Aggregate review ratings
    const allApprovedReviews = await prisma.review.findMany({
      where: { collegeId: college.id, status: "APPROVED" },
      select: {
        ratingOverall:   true,
        ratingPlacement: true,
        ratingFaculty:   true,
        ratingInfra:     true,
      },
    });

    const reviewCount = allApprovedReviews.length;
    const aggregates =
      reviewCount > 0
        ? {
            avgOverall:   avg(allApprovedReviews.map((r) => r.ratingOverall)),
            avgPlacement: avg(allApprovedReviews.map((r) => r.ratingPlacement)),
            avgFaculty:   avg(allApprovedReviews.map((r) => r.ratingFaculty)),
            avgInfra:     avg(allApprovedReviews.map((r) => r.ratingInfra)),
            reviewCount,
          }
        : null;

    return NextResponse.json({ ...college, aggregates });
  } catch (error) {
    console.error("[GET /api/colleges/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch college" },
      { status: 500 }
    );
  }
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}