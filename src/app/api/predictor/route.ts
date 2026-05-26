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

        // Group by year, take the MAX cutoff value per year
        // (highest rank number = last closing rank = most accessible branch)
        // This answers: "Can I get into ANY branch at this college?"
        const byYear: Record<number, number> = {};
        for (const c of cutoffs) {
          if (!byYear[c.year] || c.cutoffValue > byYear[c.year]) {
            byYear[c.year] = c.cutoffValue;
          }
        }

        // Average the last-closing-rank across the available years
        const years = Object.keys(byYear).map(Number).sort((a, b) => b - a).slice(0, 3);
        const avgLastRank = years.reduce((sum, y) => sum + byYear[y], 0) / years.length;

        const isScoreBased = ["BITSAT", "VITEEE", "SRMJEEE", "MET"].some((e) =>
          exam.toUpperCase().includes(e.toUpperCase())
        );

        let probability: "high" | "medium" | "low";
        if (isScoreBased) {
          // Higher score = better
          const diff = percentile - avgLastRank;
          probability =
            diff >= avgLastRank * 0.1  ? "high"
            : diff >= 0               ? "medium"
            : "low";
        } else {
          // Rank-based: lower rank number = better
          // diff > 0 means your rank is better than the last closing rank → you're in
          const diff = avgLastRank - percentile;
          probability =
            diff >= avgLastRank * 0.15 ? "high"   // rank much better than last closing
            : diff >= 0               ? "medium"  // rank just within last closing
            : "low";                              // rank worse than last closing
        }

        return {
          collegeId:   college.id,
          slug:        college.slug,
          name:        college.name,
          city:        college.city,
          nirfRank:    college.nirfRank,
          avgCutoff:   Math.round(avgLastRank),
          cutoffs:     years.map((y) => ({ year: y, cutoffValue: byYear[y] })),
          probability,
          avgPackage:  college.placementStats[0]?.avgPackage ?? null,
          minFee:      college.courseFees[0]?.annualFee     ?? null,
        };
      });

    // Sort: high first, then medium, then low
    const order = { high: 0, medium: 1, low: 2 };
    results.sort((a, b) => order[a.probability] - order[b.probability]);

    return NextResponse.json({ exam, percentile, category, results });
  } catch (error) {
    console.error("[GET /api/predictor]", error);
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
  }
}
