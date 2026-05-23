import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const exam = searchParams.get("exam") || "";
    const rank = parseInt(searchParams.get("rank") || "0", 10);
    const branch = searchParams.get("branch") || "";

    if (!exam || !rank) {
      return NextResponse.json(
        { error: "exam and rank are required" },
        { status: 400 }
      );
    }

    // Fetch all colleges whose examCutoff mentions the selected exam
    const allEligible = await prisma.college.findMany({
      where: {
        examCutoff: {
          contains: exam,
          mode: "insensitive",
        },
        ...(branch
          ? { courses: { contains: branch, mode: "insensitive" } }
          : {}),
      },
      orderBy: { rating: "desc" },
    });

    // Parse rank thresholds from examCutoff string
    // e.g. "JEE Advanced Rank under 100" -> threshold 100
    // e.g. "MHT-CET Rank under 2000"     -> threshold 2000
    // e.g. "BITSAT Score above 350"       -> inverted (higher is better)
    const results = allEligible.filter((college) => {
      const cutoff = college.examCutoff.toLowerCase();

      // Handle "score above X" (BITSAT, VITEEE — higher score = better)
      const aboveMatch = cutoff.match(/score above (\d+)/);
      if (aboveMatch) {
        const threshold = parseInt(aboveMatch[1], 10);
        return rank >= threshold;
      }

      // Handle "rank under X" — lower rank = better
      const underMatch = cutoff.match(/rank under ([\d,]+)/);
      if (underMatch) {
        const threshold = parseInt(underMatch[1].replace(/,/g, ""), 10);
        return rank <= threshold;
      }

      // Handle "rank under X" with written numbers
      return true;
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Prediction failed" },
      { status: 500 }
    );
  }
}
