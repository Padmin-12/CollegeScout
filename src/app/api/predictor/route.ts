import { prisma } from "@/lib/prisma";
import {
  latestLastClosingRank,
  isScoreBasedExam,
  isPercentileExam,
} from "@/lib/cutoffs";
import { NextRequest, NextResponse } from "next/server";

// GET /api/predictor?exam=JEE Advanced&percentile=95&category=General
export async function GET(req: NextRequest) {
  try {
    const sp       = req.nextUrl.searchParams;
    const exam     = (sp.get("exam") ?? "").trim();
    const rawVal   = sp.get("percentile") ?? sp.get("score") ?? sp.get("rank") ?? "";
    const category = (sp.get("category") ?? "General").trim();

    if (!exam || !rawVal.trim()) {
      return NextResponse.json(
        { error: "Exam and rank/score/percentile are required." },
        { status: 400 }
      );
    }

    const value = parseFloat(rawVal);
    if (isNaN(value) || !isFinite(value) || value <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid positive number." },
        { status: 400 }
      );
    }

    const isScore = isScoreBasedExam(exam);
    const isPct = isPercentileExam(exam);

    if (isPct && value > 100) {
      return NextResponse.json(
        { error: "Percentile must be between 0 and 100." },
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
        const cutoffs = college.admissionCutoffs.map((c) => ({
          id: c.id,
          exam: c.exam,
          year: c.year,
          category: c.category,
          branch: c.branch,
          cutoffValue: c.cutoffValue,
        }));

        const lastClosingRank = latestLastClosingRank(cutoffs);
        if (lastClosingRank == null) return null;

        const latestYear = Math.max(...cutoffs.map((c) => c.year));

        let probability: "high" | "medium" | "low";
        if (isScore || isPct) {
          // Higher score/percentile is better
          const diff = value - lastClosingRank;
          probability =
            diff >= lastClosingRank * 0.1 ? "high"
            : diff >= 0                    ? "medium"
            : "low";
        } else {
          // Lower rank number is better
          const diff = lastClosingRank - value;
          probability =
            diff >= lastClosingRank * 0.15 ? "high"
            : diff >= 0                    ? "medium"
            : "low";
        }

        return {
          collegeId:         college.id,
          slug:              college.slug,
          name:              college.name,
          city:              college.city,
          nirfRank:          college.nirfRank,
          lastClosingRank:   Math.round(lastClosingRank),
          lastClosingValue:  Math.round(lastClosingRank),
          cutoffYear:        latestYear,
          probability,
          likelihood:        probability,
          avgPackage:        college.placementStats[0]?.avgPackage ?? null,
          minFee:            college.courseFees[0]?.annualFee     ?? null,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r != null);

    // Sort: high likelihood first, then medium, then low
    const order = { high: 0, medium: 1, low: 2 };
    results.sort((a, b) => order[a.probability] - order[b.probability]);

    return NextResponse.json({ exam, percentile: value, category, results });
  } catch (error) {
    console.error("[GET /api/predictor]", error);
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
  }
}
