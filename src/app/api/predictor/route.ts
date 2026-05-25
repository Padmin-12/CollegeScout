import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/predictor?exam=JEE Advanced&percentile=95&category=General
export async function GET(req: NextRequest) {
  try {
    const sp         = req.nextUrl.searchParams;
    const exam       = sp.get("exam")       ?? "";
    const percentile = parseFloat(sp.get("percentile") ?? "0");
    const category   = sp.get("category")  ?? "General";

    if (!exam || !percentile) {
      return NextResponse.json(
        { error: "exam and percentile are required" },
        { status: 400 }
      );
    }

    // Get all colleges that have cutoffs for this exam
    const colleges = await prisma.college.findMany({
      where: {
        admissionCutoffs: { some: { exam: { contains: exam, mode: "insensitive" } } },
      },
      include: {
        admissionCutoffs: {
          where: {
            exam:     { contains: exam, mode: "insensitive" },
            category: { contains: category, mode: "insensitive" },
          },
          orderBy: { year: "desc" },
        },
        placementStats: {
          orderBy: { year: "desc" },
          take: 1,
        },
        courseFees: {
          orderBy: { annualFee: "asc" },
          take: 1,
        },
      },
      orderBy: { nirfRank: "asc" },
    });

    const results = colleges
      .filter((c) => c.admissionCutoffs.length > 0)
      .map((college) => {
        const cutoffs = college.admissionCutoffs;

        // Average cutoff across available years
        const avgCutoff =
          cutoffs.reduce((sum, c) => sum + c.cutoffValue, 0) / cutoffs.length;

        // Determine probability bucket
        // For rank-based exams (JEE): lower percentile = worse → compare rank not percentile
        // We store JEE as rank values — lower rank is better
        // For score-based (BITSAT/VITEEE): higher is better
        const isScoreBased = ["BITSAT", "VITEEE", "SRMJEEE", "MET"].some((e) =>
          exam.toUpperCase().includes(e.toUpperCase())
        );

        let probability: "safe" | "moderate" | "reach";
        if (isScoreBased) {
          // Higher score is better
          const diff = percentile - avgCutoff; // positive means above cutoff
          probability =
            diff >= avgCutoff * 0.1  ? "safe"
            : diff >= 0              ? "moderate"
            : "reach";
        } else {
          // Rank-based: lower rank is better; percentile here is actually the rank submitted
          const diff = avgCutoff - percentile; // positive means rank is better than cutoff
          probability =
            diff >= avgCutoff * 0.15 ? "safe"
            : diff >= 0             ? "moderate"
            : "reach";
        }

        return {
          collegeId:   college.id,
          slug:        college.slug,
          name:        college.name,
          city:        college.city,
          nirfRank:    college.nirfRank,
          avgCutoff:   Math.round(avgCutoff),
          cutoffs:     cutoffs.map((c) => ({
            year:         c.year,
            cutoffValue:  c.cutoffValue,
          })),
          probability,
          avgPackage:  college.placementStats[0]?.avgPackage ?? null,
          minFee:      college.courseFees[0]?.annualFee     ?? null,
        };
      });

    // Sort: safe first, then moderate, then reach
    const order = { safe: 0, moderate: 1, reach: 2 };
    results.sort((a, b) => order[a.probability] - order[b.probability]);

    return NextResponse.json({ exam, percentile, category, results });
  } catch (error) {
    console.error("[GET /api/predictor]", error);
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
  }
}
