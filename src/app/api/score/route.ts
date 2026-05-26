import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scoreColleges } from "@/lib/scoring";

// ── Validation ─────────────────────────────────────────────────────────────

const ScoreRequestSchema = z.object({
  weights: z.object({
    placement: z.number().min(0).max(1),
    fees:      z.number().min(0).max(1),
    location:  z.number().min(0).max(1),
  }),
  filters: z.object({
    stream: z.string().optional(),
    city:   z.string().optional(),
    type:   z.enum(["GOVT", "PRIVATE", "DEEMED"]).optional(),
  }).optional(),
});

// ── POST /api/score ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json() as unknown;
    const parsed = ScoreRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { weights, filters } = parsed.data;

    // ── Fetch colleges with latest placement + min fee ───────────────────
    const colleges = await prisma.college.findMany({
      where: {
        AND: [
          filters?.stream ? { streams: { has: filters.stream } }                        : {},
          filters?.city   ? { city: { contains: filters.city, mode: "insensitive" } }  : {},
          filters?.type   ? { type: filters.type }                                       : {},
        ],
      },
      select: {
        id:       true,
        slug:     true,
        name:     true,
        city:     true,
        state:    true,
        nirfRank: true,
        placementStats: {
          orderBy: { year: "desc" },
          take:    1,
          select:  { avgPackage: true },
        },
        courseFees: {
          orderBy: { annualFee: "asc" },
          take:    1,
          select:  { annualFee: true },
        },
      },
    });

    // ── Flatten for scoring engine ────────────────────────────────────────
    const inputs = colleges.map((c) => ({
      id:         c.id,
      slug:       c.slug,
      name:       c.name,
      city:       c.city,
      state:      c.state,
      nirfRank:   c.nirfRank,
      avgPackage: c.placementStats[0]?.avgPackage ?? null,
      minFee:     c.courseFees[0]?.annualFee      ?? null,
    }));

    // ── Score ─────────────────────────────────────────────────────────────
    const scored = scoreColleges(inputs, weights);

    return NextResponse.json({
      weights,
      filters: filters ?? {},
      results: scored,
      total:   scored.length,
    });
  } catch (error) {
    console.error("[POST /api/score]", error);
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
  }
}
