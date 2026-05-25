import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ── Validation schema ──────────────────────────────────────────────────────

const ReviewSchema = z.object({
  authorName:      z.string().min(1, "Name is required"),
  batchYear:       z.number().int().min(2000).max(new Date().getFullYear()),
  stream:          z.string().min(1, "Stream is required"),
  ratingOverall:   z.number().min(1).max(5),
  ratingPlacement: z.number().min(1).max(5),
  ratingFaculty:   z.number().min(1).max(5),
  ratingInfra:     z.number().min(1).max(5),
  body:            z.string().min(80, "Review must be at least 80 characters"),
});

// ── GET /api/colleges/[id]/reviews — paginated, approved only ─────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }  = await params;
    const sp      = req.nextUrl.searchParams;
    const page    = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const limit   = Math.min(20, Math.max(1, parseInt(sp.get("limit") ?? "10", 10)));
    const skip    = (page - 1) * limit;

    // Resolve college by id or slug
    const college = await prisma.college.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where:   { collegeId: college.id, status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, authorName: true, batchYear: true, stream: true,
          ratingOverall: true, ratingPlacement: true, ratingFaculty: true, ratingInfra: true,
          body: true, createdAt: true,
        },
      }),
      prisma.review.count({ where: { collegeId: college.id, status: "APPROVED" } }),
    ]);

    // Live aggregates
    const allRatings = await prisma.review.findMany({
      where: { collegeId: college.id, status: "APPROVED" },
      select: { ratingOverall: true, ratingPlacement: true, ratingFaculty: true, ratingInfra: true },
    });

    const agg = allRatings.length > 0 ? {
      overall:   avg(allRatings.map((r) => r.ratingOverall)),
      placement: avg(allRatings.map((r) => r.ratingPlacement)),
      faculty:   avg(allRatings.map((r) => r.ratingFaculty)),
      infra:     avg(allRatings.map((r) => r.ratingInfra)),
      count:     allRatings.length,
    } : null;

    return NextResponse.json({
      data: reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      aggregates: agg,
    });
  } catch (error) {
    console.error("[GET /api/colleges/[id]/reviews]", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// ── POST /api/colleges/[id]/reviews — submit (lands as PENDING) ────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Resolve college
    const college = await prisma.college.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    const body = await req.json() as unknown;
    const parsed = ReviewSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() ?? "_global";
        fields[key] = issue.message;
      }
      return NextResponse.json({ error: "Validation failed", fields }, { status: 422 });
    }

    const review = await prisma.review.create({
      data: {
        collegeId:       college.id,
        authorName:      parsed.data.authorName,
        batchYear:       parsed.data.batchYear,
        stream:          parsed.data.stream,
        ratingOverall:   parsed.data.ratingOverall,
        ratingPlacement: parsed.data.ratingPlacement,
        ratingFaculty:   parsed.data.ratingFaculty,
        ratingInfra:     parsed.data.ratingInfra,
        body:            parsed.data.body,
        status:          "PENDING",
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("[POST /api/colleges/[id]/reviews]", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
