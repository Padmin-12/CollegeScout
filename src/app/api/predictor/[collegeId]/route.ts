import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/predictor/[collegeId]?exam=JEE Advanced&percentile=92&category=GENERAL
// Returns { probability: 'high'|'medium'|'low', cutoff_context: {...} }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const { collegeId } = await params;
    const sp            = req.nextUrl.searchParams;
    const exam          = sp.get("exam")       ?? "";
    const percentile    = parseFloat(sp.get("percentile") ?? "0");
    const category      = sp.get("category")  ?? "General";

    if (!exam || !percentile) {
      return NextResponse.json(
        { error: "exam and percentile are required" },
        { status: 400 }
      );
    }

    // Resolve college by id or slug
    const college = await prisma.college.findFirst({
      where:   { OR: [{ id: collegeId }, { slug: collegeId }] },
      select:  { id: true, slug: true, name: true },
    });

    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // Fetch cutoffs for this college, this exam
    const cutoffs = await prisma.admissionCutoff.findMany({
      where: {
        collegeId: college.id,
        exam:      { contains: exam, mode: "insensitive" },
        category:  { contains: category, mode: "insensitive" },
      },
      orderBy: { year: "desc" },
      take:    3, // last 3 years
    });

    if (cutoffs.length === 0) {
      // Try without category filter (fall back to General)
      const fallback = await prisma.admissionCutoff.findMany({
        where: {
          collegeId: college.id,
          exam: { contains: exam, mode: "insensitive" },
        },
        orderBy: { year: "desc" },
        take: 3,
      });

      if (fallback.length === 0) {
        return NextResponse.json({
          probability:    "low",
          cutoff_context: null,
          reason:         `No cutoff data found for ${exam} at ${college.name}`,
        });
      }
      cutoffs.push(...fallback.slice(0, 3 - cutoffs.length));
    }

    // Average cutoff value across available years
    const avgCutoff = cutoffs.reduce((s, c) => s + c.cutoffValue, 0) / cutoffs.length;

    // Determine if exam is score-based (higher = better) or rank-based (lower = better)
    const isScoreBased = ["BITSAT", "VITEEE", "SRMJEEE", "MET"].some((e) =>
      exam.toUpperCase().includes(e)
    );

    // Calculate probability
    let probability: "high" | "medium" | "low";

    if (isScoreBased) {
      // Higher score → better. percentile here is the score.
      const margin = (percentile - avgCutoff) / avgCutoff;
      probability =
        margin >= 0.1  ? "high"
        : margin >= 0  ? "medium"
        : "low";
    } else {
      // Rank-based: lower rank → better. percentile here is the rank.
      const margin = (avgCutoff - percentile) / avgCutoff;
      probability =
        margin >= 0.15 ? "high"
        : margin >= 0  ? "medium"
        : "low";
    }

    const cutoff_context = {
      exam,
      category,
      avgCutoff:    Math.round(avgCutoff),
      yourScore:    percentile,
      dataPoints:   cutoffs.map((c) => ({
        year:  c.year,
        value: c.cutoffValue,
      })),
      isScoreBased,
    };

    return NextResponse.json({
      collegeId:   college.id,
      slug:        college.slug,
      name:        college.name,
      probability,
      cutoff_context,
    });
  } catch (error) {
    console.error("[GET /api/predictor/[collegeId]]", error);
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
  }
}
