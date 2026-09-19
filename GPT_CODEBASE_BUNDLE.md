# CollegeScout Codebase Bundle for GPT

This document aggregates all requested files across the 8 functional areas of the CollegeScout codebase.
Generated on: 2026-09-19T02:45:57.298Z

---

# 1. College Listing

## 1.1 College Listing Route (KNOWN BUG: sort by count instead of fee/pkg)
**File:** `src/app/api/colleges/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    // Batch fetch by IDs (used by guest shortlist)
    const idsParam = sp.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      const colleges = await prisma.college.findMany({
        where: { id: { in: ids } },
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
      });
      const mapped = colleges.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        city: c.city,
        state: c.state,
        type: c.type,
        nirfRank: c.nirfRank,
        avgPackage: c.placementStats[0]?.avgPackage ?? null,
        maxPackage: c.placementStats[0]?.maxPackage ?? null,
        placementPct: c.placementStats[0]?.placementPct ?? null,
        minFee: c.courseFees.length > 0
          ? Math.min(...c.courseFees.map((f) => f.annualFee))
          : null,
      }));
      // Preserve the order from localStorage
      const ordered = ids.map((id) => mapped.find((c) => c.id === id)).filter(Boolean);
      return NextResponse.json({ colleges: ordered });
    }

    const search  = sp.get("search")  ?? "";
    const stream  = sp.get("stream")  ?? "";
    const city    = sp.get("city")    ?? "";
    const type    = sp.get("type")    ?? "";   // GOVT | PRIVATE | DEEMED
    const feesMax = sp.get("fees_max") ? parseInt(sp.get("fees_max")!, 10) : null;
    const sort    = sp.get("sort")    ?? "nirf"; // nirf | placement | fees_asc | fees_desc

    const page  = Math.max(1, parseInt(sp.get("page")  ?? "1",  10));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "9", 10)));
    const skip  = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CollegeWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name:  { contains: search, mode: "insensitive" } },
                { city:  { contains: search, mode: "insensitive" } },
                { state: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        stream ? { streams: { has: stream } } : {},
        city   ? { city: { contains: city, mode: "insensitive" } } : {},
        type   ? { type: type as "GOVT" | "PRIVATE" | "DEEMED" } : {},
        feesMax != null
          ? {
              courseFees: {
                some: { annualFee: { lte: feesMax } },
              },
            }
          : {},
      ],
    };

    // Sort mapping
    const orderBy: Prisma.CollegeOrderByWithRelationInput =
      sort === "placement"
        ? { placementStats: { _count: "desc" } }
        : sort === "fees_asc"
        ? { courseFees: { _count: "asc" } }   // proxy — real sort done post-query for fees
        : sort === "fees_desc"
        ? { courseFees: { _count: "desc" } }
        : { nirfRank: "asc" };                 // default: nirf rank ascending (lower = better)

    const [colleges, total] = await Promise.all([
      prisma.college.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id:          true,
          slug:        true,
          name:        true,
          city:        true,
          state:       true,
          type:        true,
          streams:     true,
          nirfRank:    true,
          established: true,
          accreditation: true,
          courseFees: {
            select: { annualFee: true },
            orderBy: { annualFee: "asc" },
            take: 1,  // lowest fee for display
          },
          placementStats: {
            select: { avgPackage: true, maxPackage: true, placementPct: true },
            orderBy: { year: "desc" },
            take: 1,  // latest year only
          },
        },
      }),
      prisma.college.count({ where }),
    ]);

    // Flatten for easy frontend consumption
    const data = colleges.map((c) => ({
      id:            c.id,
      slug:          c.slug,
      name:          c.name,
      city:          c.city,
      state:         c.state,
      type:          c.type,
      streams:       c.streams,
      nirfRank:      c.nirfRank,
      accreditation: c.accreditation,
      minAnnualFee:  c.courseFees[0]?.annualFee  ?? null,
      avgPackage:    c.placementStats[0]?.avgPackage  ?? null,
      maxPackage:    c.placementStats[0]?.maxPackage  ?? null,
      placementPct:  c.placementStats[0]?.placementPct ?? null,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/colleges]", error);
    return NextResponse.json(
      { error: "Failed to fetch colleges" },
      { status: 500 }
    );
  }
}
```

## 1.2 College Detail by ID/Slug Route
**File:** `src/app/api/colleges/[id]/route.ts`

```typescript
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
```

## 1.3 College Compare Route (Detailed)
**File:** `src/app/api/colleges/compare/route.ts`

```typescript
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
```

## 1.4 Simple Compare Route (2 IDs)
**File:** `src/app/api/compare/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const id1 = searchParams.get("id1");
    const id2 = searchParams.get("id2");

    if (!id1 || !id2) {
      return NextResponse.json(
        { error: "Both college IDs are required" },
        { status: 400 }
      );
    }

    const colleges = await prisma.college.findMany({
      where: {
        id: {
          in: [id1, id2],
        },
      },
    });

    return NextResponse.json(colleges);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to compare colleges" },
      { status: 500 }
    );
  }
}
```

# 2. Scoring

## 2.1 Scoring Engine (contains scoreColleges)
**File:** `src/lib/scoring.ts`

```typescript
// src/lib/scoring.ts

export type ScoringInput = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  nirfRank: number | null;
  avgPackage: number | null;
  minFee: number | null;
};

// Aliases used by tests and external callers
export type CollegeInput = ScoringInput;

export type Weights = {
  placement: number;
  fees: number;
  location: number;
};

// Alias used by tests
export type WeightInput = Weights;

export type ScoredCollege = ScoringInput & {
  score: number;
  dimensionScores: {
    placement: number;
    fees: number;
    location: number;
  };
};



export function scoreColleges(inputs: ScoringInput[], weights: Weights): ScoredCollege[] {
  if (inputs.length === 0) return [];

  // Get ranges for normalisation
  const packages = inputs.map((i) => i.avgPackage ?? 0);
  const fees     = inputs.map((i) => i.minFee ?? 0);
  const ranks    = inputs.map((i) => i.nirfRank ?? 999);

  const minPkg = Math.min(...packages), maxPkg = Math.max(...packages);
  const minFee = Math.min(...fees),     maxFee = Math.max(...fees);
  const minRnk = Math.min(...ranks),    maxRnk = Math.max(...ranks);

  // Normalise weights to sum to 1
  const totalWeight = weights.placement + weights.fees + weights.location || 1;
  const normWeights = {
    placement: weights.placement / totalWeight,
    fees:      weights.fees      / totalWeight,
    location:  weights.location  / totalWeight,
  };

  const norm = (v: number, lo: number, hi: number) =>
    hi === lo ? 0.5 : Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

  const scored: ScoredCollege[] = inputs.map((college) => {
    // Placement: higher package = better
    const placementScore = norm(college.avgPackage ?? 0, minPkg, maxPkg);

    // Fees: lower fee = better → invert
    const feesScore = 1 - norm(college.minFee ?? 0, minFee, maxFee);

    // Location (NIRF rank proxy): lower rank number = better → invert
    const locationScore = 1 - norm(college.nirfRank ?? 999, minRnk, maxRnk);

    const weightedScore =
      placementScore * normWeights.placement +
      feesScore      * normWeights.fees      +
      locationScore  * normWeights.location;

    return {
      ...college,
      score: Math.round(weightedScore * 1000) / 10, // 0–100
      dimensionScores: {
        placement: Math.round(placementScore * 1000) / 10,
        fees:      Math.round(feesScore      * 1000) / 10,
        location:  Math.round(locationScore  * 1000) / 10,
      },
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}
```

## 2.2 Score API Route
**File:** `src/app/api/score/route.ts`

```typescript
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
```

## 2.3 Scoring Unit Tests
**File:** `src/lib/__tests__/scoring.test.ts`

```typescript
/**
 * Scoring engine unit tests
 * Run with: npx ts-node --esm src/lib/__tests__/scoring.test.ts
 * (No external test runner needed — uses Node's built-in assert)
 */

import assert from "node:assert/strict";
import { scoreColleges, type CollegeInput, type WeightInput } from "../scoring";

// ── Test data ────────────────────────────────────────────────────────────────

const colleges: CollegeInput[] = [
  {
    id: "1", slug: "iit-bombay", name: "IIT Bombay",
    city: "Mumbai", state: "Maharashtra", nirfRank: 3,
    avgPackage: 27.5, minFee: 220000,
  },
  {
    id: "2", slug: "nit-trichy", name: "NIT Trichy",
    city: "Tiruchirappalli", state: "Tamil Nadu", nirfRank: 8,
    avgPackage: 15.2, minFee: 155000,
  },
  {
    id: "3", slug: "jadavpur-university", name: "Jadavpur University",
    city: "Kolkata", state: "West Bengal", nirfRank: 12,
    avgPackage: 12.5, minFee: 25000,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

// ── Test Suite ───────────────────────────────────────────────────────────────

console.log("\nScoring Engine Tests\n");

// ── Edge Case 1: Equal weights (1/3 each) ────────────────────────────────────
runTest("Edge Case 1 — equal weights produce deterministic ranked output", () => {
  const weights: WeightInput = { placement: 1 / 3, fees: 1 / 3, location: 1 / 3 };
  const results = scoreColleges(colleges, weights);

  // Must return all colleges
  assert.equal(results.length, 3, "Should return all 3 colleges");

  // Scores must be between 0 and 100
  for (const r of results) {
    assert.ok(r.score >= 0 && r.score <= 100, `Score ${r.score} out of 0-100 range`);
  }

  // Results must be sorted descending by score
  for (let i = 0; i < results.length - 1; i++) {
    assert.ok(
      results[i].score >= results[i + 1].score,
      `Results not sorted: ${results[i].score} < ${results[i + 1].score}`
    );
  }

  // Deterministic: run twice, same order
  const results2 = scoreColleges(colleges, weights);
  assert.deepEqual(
    results.map((r) => r.id),
    results2.map((r) => r.id),
    "Results should be deterministic"
  );
});

// ── Edge Case 2: Single weight = 100% (placement only) ───────────────────────
runTest("Edge Case 2 — single weight 100% placement ranks by avg package only", () => {
  const weights: WeightInput = { placement: 1.0, fees: 0, location: 0 };
  const results = scoreColleges(colleges, weights);

  // IIT Bombay (27.5 LPA) must be #1
  assert.equal(results[0].id, "1", "IIT Bombay should be #1 with highest package");

  // NIT Trichy (15.2 LPA) must be #2
  assert.equal(results[1].id, "2", "NIT Trichy should be #2");

  // Jadavpur (12.5 LPA) must be #3
  assert.equal(results[2].id, "3", "Jadavpur should be #3 with lowest package");

  // Top college should have score = 100
  assert.equal(results[0].score, 100, "Top placement college should score 100");

  // Bottom college should score 0
  assert.equal(results[results.length - 1].score, 0, "Bottom placement college should score 0");
});

// ── Edge Case 3: Extreme fee range — fees 100% weight ───────────────────────
runTest("Edge Case 3 — extreme fee range with 100% fees weight ranks cheapest first", () => {
  const weights: WeightInput = { placement: 0, fees: 1.0, location: 0 };
  const results = scoreColleges(colleges, weights);

  // Jadavpur (₹25,000) must be #1 (cheapest = best when fees=100%)
  assert.equal(results[0].id, "3", "Jadavpur (cheapest) should be #1 with fees-only weight");

  // IIT Bombay (₹2,20,000) must be #3 (most expensive = worst)
  assert.equal(results[results.length - 1].id, "1", "IIT Bombay (costliest) should be last");

  // Top college scores 100
  assert.equal(results[0].score, 100, "Cheapest college should score 100");
});

// ── Edge Case 4: Empty college list ──────────────────────────────────────────
runTest("Edge Case 4 — empty input returns empty array", () => {
  const weights: WeightInput = { placement: 0.6, fees: 0.3, location: 0.1 };
  const results = scoreColleges([], weights);
  assert.equal(results.length, 0, "Empty input should return empty array");
});

// ── Edge Case 5: Weights sum > 1 are normalised ───────────────────────────────
runTest("Edge Case 5 — weights summing to >1 are normalised correctly", () => {
  // 6+3+1 = 10, normalised to 0.6/0.3/0.1
  const weights: WeightInput = { placement: 6, fees: 3, location: 1 };
  const normalResults = scoreColleges(colleges, weights);

  const canonicalWeights: WeightInput = { placement: 0.6, fees: 0.3, location: 0.1 };
  const canonicalResults = scoreColleges(colleges, canonicalWeights);

  assert.deepEqual(
    normalResults.map((r) => r.id),
    canonicalResults.map((r) => r.id),
    "Normalised weights should produce same ranking as canonical 0.6/0.3/0.1"
  );
});

console.log("\n");
```

# 3. Predictor

## 3.1 Predictor Route
**File:** `src/app/api/predictor/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { latestLastClosingRank } from "@/lib/cutoffs";
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

        const isScoreBased = ["BITSAT", "VITEEE", "SRMJEEE", "MET"].some((e) =>
          exam.toUpperCase().includes(e.toUpperCase())
        );

        let probability: "high" | "medium" | "low";
        if (isScoreBased) {
          const diff = percentile - lastClosingRank;
          probability =
            diff >= lastClosingRank * 0.1 ? "high"
            : diff >= 0                    ? "medium"
            : "low";
        } else {
          const diff = lastClosingRank - percentile;
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
          cutoffYear:        latestYear,
          probability,
          avgPackage:        college.placementStats[0]?.avgPackage ?? null,
          minFee:            college.courseFees[0]?.annualFee     ?? null,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r != null);

    // Sort: high first, then medium, then low
    const order = { high: 0, medium: 1, low: 2 };
    results.sort((a, b) => order[a.probability] - order[b.probability]);

    return NextResponse.json({ exam, percentile, category, results });
  } catch (error) {
    console.error("[GET /api/predictor]", error);
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
  }
}
```

## 3.2 Predictor College-Specific Route
**File:** `src/app/api/predictor/[collegeId]/route.ts`

```typescript
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
```

## 3.3 Cutoff Processing Utility
**File:** `src/lib/cutoffs.ts`

```typescript
/** Cutoff row shape used across UI and APIs */
export type CutoffRow = {
  id: string;
  exam: string;
  year: number;
  category: string;
  branch: string;
  cutoffValue: number;
};

/** Per exam/year/category: last rank/score needed to get into ANY branch */
export type CutoffSummary = {
  exam: string;
  year: number;
  category: string;
  lastClosingRank: number;
  easiestBranch: string;
  branches: { branch: string; cutoffValue: number }[];
};

/**
 * For rank-based exams, the highest cutoff value across branches = last seat filled
 * (most accessible branch to enter the college).
 */
export function summarizeCutoffs(rows: CutoffRow[]): CutoffSummary[] {
  const groups = new Map<string, CutoffRow[]>();

  for (const row of rows) {
    const key = `${row.exam}::${row.year}::${row.category}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const summaries: CutoffSummary[] = [];

  for (const [, group] of groups) {
    const sample = group[0];
    const branches = group
      .map((r) => ({ branch: r.branch || "General", cutoffValue: r.cutoffValue }))
      .sort((a, b) => b.cutoffValue - a.cutoffValue);

    const easiest = branches[0];
    if (!easiest) continue;

    summaries.push({
      exam: sample.exam,
      year: sample.year,
      category: sample.category,
      lastClosingRank: easiest.cutoffValue,
      easiestBranch: easiest.branch,
      branches,
    });
  }

  return summaries.sort((a, b) => {
    if (a.exam !== b.exam) return a.exam.localeCompare(b.exam);
    if (b.year !== a.year) return b.year - a.year;
    return a.category.localeCompare(b.category);
  });
}

/** Latest year's last closing rank for predictor (any branch). */
export function latestLastClosingRank(rows: CutoffRow[]): number | null {
  if (!rows.length) return null;
  const latestYear = Math.max(...rows.map((r) => r.year));
  const latest = rows.filter((r) => r.year === latestYear);
  return Math.max(...latest.map((r) => r.cutoffValue));
}

export function cutoffValueLabel(exam: string): string {
  const upper = exam.toUpperCase();
  if (upper.includes("MHT-CET") || upper.includes("PERCENTILE")) return "Percentile";
  if (["BITSAT", "VITEEE", "SRMJEEE", "MET"].some((e) => upper.includes(e))) return "Score";
  return "Closing rank";
}
```

# 4. Reviews

## 4.1 Review Submission & Retrieval API (with Zod schema)
**File:** `src/app/api/colleges/[id]/reviews/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ── Validation schema ──────────────────────────────────────────────────────

const ReviewSchema = z.object({
  authorName:      z.string().min(1, "Name is required"),
  batchYear:       z.number().int().min(2010, "Batch year must be 2010 or later").max(new Date().getFullYear(), `Batch year cannot exceed ${new Date().getFullYear()}`),
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
```

## 4.2 Admin Reviews Management Route
**File:** `src/app/api/admin/reviews/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function checkAdminKey(req: NextRequest): boolean {
  const key = req.headers.get("x-admin-key") ?? req.nextUrl.searchParams.get("adminKey");
  return key === process.env.ADMIN_API_KEY;
}

// GET /api/admin/reviews — list pending reviews (admin only)
export async function GET(req: NextRequest) {
  if (!checkAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sp     = req.nextUrl.searchParams;
    const status = sp.get("status") ?? "PENDING";
    const limit  = Math.min(50, parseInt(sp.get("limit") ?? "20", 10));
    const offset = parseInt(sp.get("offset") ?? "0", 10);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where:   { status: status as "PENDING" | "APPROVED" | "REJECTED" },
        orderBy: { createdAt: "asc" },
        skip:    offset,
        take:    limit,
        include: { college: { select: { name: true, slug: true } } },
      }),
      prisma.review.count({ where: { status: status as "PENDING" | "APPROVED" | "REJECTED" } }),
    ]);

    return NextResponse.json({ data: reviews, total, offset, limit });
  } catch (error) {
    console.error("[GET /api/admin/reviews]", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
```

## 4.3 Admin Review Approval Route
**File:** `src/app/api/admin/reviews/[id]/approve/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function checkAdminKey(req: NextRequest): boolean {
  const key = req.headers.get("x-admin-key") ?? req.nextUrl.searchParams.get("adminKey");
  return key === process.env.ADMIN_API_KEY;
}

// POST /api/admin/reviews/[id]/approve

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data:  { status: "APPROVED" },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    console.error("[POST /api/admin/reviews/[id]/approve]", error);
    return NextResponse.json({ error: "Failed to approve review" }, { status: 500 });
  }
}
```

## 4.4 Admin Review Rejection Route
**File:** `src/app/api/admin/reviews/[id]/reject/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function checkAdminKey(req: NextRequest): boolean {
  const key = req.headers.get("x-admin-key") ?? req.nextUrl.searchParams.get("adminKey");
  return key === process.env.ADMIN_API_KEY;
}

// POST /api/admin/reviews/[id]/reject

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data:  { status: "REJECTED" },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    console.error("[POST /api/admin/reviews/[id]/reject]", error);
    return NextResponse.json({ error: "Failed to reject review" }, { status: 500 });
  }
}
```

## 4.5 Admin Reviews Moderation Page
**File:** `src/app/admin/reviews/page.tsx`

```tsx
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

type PendingReview = {
  id: string;
  authorName: string;
  batchYear: number;
  stream: string;
  ratingOverall: number;
  body: string;
  createdAt: string;
  college: { name: string; slug: string };
};

export default function AdminReviewsPage() {
  const [adminKey, setAdminKey] = useState("");
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPending() {
    if (!adminKey.trim()) {
      setMessage("Enter your admin API key first.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/reviews?status=PENDING&limit=50", {
        headers: { "x-admin-key": adminKey.trim() },
      });
      const data = await res.json() as { data?: PendingReview[]; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Unauthorized — check ADMIN_API_KEY in .env");
        setReviews([]);
      } else {
        setReviews(data.data ?? []);
        setMessage(`${(data.data ?? []).length} pending review(s)`);
      }
    } catch {
      setMessage("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  async function moderate(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/reviews/${id}/${action}`, {
      method: "POST",
      headers: { "x-admin-key": adminKey.trim() },
    });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setMessage(`Review ${action}d. It will ${action === "approve" ? "now appear" : "not appear"} on the college page.`);
    } else {
      setMessage(`Failed to ${action} review`);
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#F9FAFB" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px 80px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "8px" }}>
            Review Moderation
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
            Internal tool — uses <code style={{ background: "#E5E7EB", padding: "2px 6px", borderRadius: "4px" }}>ADMIN_API_KEY</code> from your .env file.
            Approved reviews show on college detail pages.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="password"
              placeholder="Admin API key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "10px 12px",
                border: "1.5px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            <button
              type="button"
              onClick={loadPending}
              disabled={loading}
              style={{
                padding: "10px 20px",
                background: "#FF385C",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Loading…" : "Load pending"}
            </button>
          </div>

          {message && (
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "16px" }}>{message}</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reviews.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "10px",
                  padding: "18px",
                }}
              >
                <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "4px" }}>
                  <a href={`/colleges/${r.college.slug}`} style={{ color: "#FF385C" }}>
                    {r.college.name}
                  </a>
                  {" · "}
                  {r.stream} · Batch {r.batchYear}
                </p>
                <p style={{ fontWeight: 700, fontSize: "14px" }}>{r.authorName}</p>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "8px 0" }}>
                  Overall: {r.ratingOverall}/5
                </p>
                <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.5, marginBottom: "12px" }}>
                  {r.body}
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => moderate(r.id, "approve")}
                    style={{
                      padding: "8px 16px",
                      background: "#16A34A",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => moderate(r.id, "reject")}
                    style={{
                      padding: "8px 16px",
                      background: "#fff",
                      color: "#DC2626",
                      border: "1px solid #FECACA",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
```

# 5. Authentication + Shortlist

## 5.1 Shortlist User Route (GET/POST/DELETE)
**File:** `src/app/api/shortlist/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── GET /api/shortlist — get all shortlisted colleges for the logged-in user ──

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shortlists = await prisma.shortlist.findMany({
      where: { userId: session.user.id },
      select: { collegeId: true },
    });

    return NextResponse.json(shortlists);
  } catch (error) {
    console.error("[GET /api/shortlist]", error);
    return NextResponse.json({ error: "Failed to fetch shortlist" }, { status: 500 });
  }
}

// ── POST /api/shortlist — add a college to the user's shortlist ───────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { collegeId } = await req.json() as { collegeId?: string };

    if (!collegeId) {
      return NextResponse.json({ error: "collegeId is required" }, { status: 400 });
    }

    const college = await prisma.college.findUnique({
      where: { id: collegeId },
      select: { id: true },
    });
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    const shortlist = await prisma.shortlist.upsert({
      where: { userId_collegeId: { userId: session.user.id, collegeId } },
      update: {},
      create: { userId: session.user.id, collegeId },
    });

    return NextResponse.json(shortlist, { status: 201 });
  } catch (error) {
    console.error("[POST /api/shortlist]", error);
    return NextResponse.json({ error: "Failed to shortlist" }, { status: 500 });
  }
}

// ── DELETE /api/shortlist — remove a college from the user's shortlist ────────

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { collegeId } = await req.json() as { collegeId?: string };

    if (!collegeId) {
      return NextResponse.json({ error: "collegeId is required" }, { status: 400 });
    }

    await prisma.shortlist.deleteMany({
      where: { userId: session.user.id, collegeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/shortlist]", error);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
```

## 5.2 Shortlist Colleges Details Route
**File:** `src/app/api/shortlist/colleges/route.ts`

```typescript
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
```

## 5.3 NextAuth Configuration
**File:** `src/lib/auth.ts`

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

## 5.4 NextAuth Route Handler
**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

## 5.5 User Registration Route
**File:** `src/app/api/auth/register/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
```

## 5.6 Login Form Component
**File:** `src/app/login/LoginForm.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #DDDDDD",
  borderRadius: "12px",
  fontSize: "14px",
  color: "#222222",
  background: "#fff",
  outline: "none",
  transition: "border-color 0.2s ease",
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTab(searchParams.get("tab") === "register" ? "register" : "login");
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setTab("login");
        setError("Account created! Please sign in.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/">
            <span
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#FF385C",
                letterSpacing: "-0.03em",
              }}
            >
              CollegeHunt
            </span>
          </Link>
          <p style={{ color: "#717171", marginTop: "8px", fontSize: "14px" }}>
            {tab === "login"
              ? "Sign in to access your saved colleges"
              : "Create an account to start your shortlist"}
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
            padding: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#F7F7F7",
              borderRadius: "12px",
              padding: "4px",
              marginBottom: "24px",
            }}
          >
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setTab("login");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                background: tab === "login" ? "#fff" : "transparent",
                color: tab === "login" ? "#FF385C" : "#717171",
                boxShadow: tab === "login" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              Sign In
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setTab("register");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                background: tab === "register" ? "#fff" : "transparent",
                color: tab === "register" ? "#FF385C" : "#717171",
                boxShadow: tab === "register" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                color: "#DC2626",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={tab === "login" ? handleLogin : handleRegister}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {tab === "register" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#222222",
                    marginBottom: "6px",
                  }}
                >
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#222222",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#222222",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "register" ? "At least 6 characters" : "Your password"}
                style={inputStyle}
              />
            </div>

            <button
              id="submit-btn"
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#FFBDCA" : "#FF385C",
                color: "#fff",
                padding: "13px",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "15px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                marginTop: "4px",
              }}
            >
              {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#717171", marginTop: "20px" }}>
          <Link
            href="/"
            style={{ color: "#717171", transition: "color 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FF385C")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#717171")}
          >
            ← Back to CollegeHunt
          </Link>
        </p>
      </div>
    </main>
  );
}
```

## 5.7 Login Page
**File:** `src/app/login/page.tsx`

```tsx
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

function LoginFallback() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p style={{ color: "#717171", fontSize: "14px" }}>Loading…</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
```

## 5.8 Guest Shortlist LocalStorage Helper
**File:** `src/lib/guestShortlist.ts`

```typescript
/**
 * Guest shortlist — persists in localStorage so the founder can demo all
 * shortlist features without needing a login / database session.
 */

const KEY = "guest_shortlist";

export type GuestEntry = { collegeId: string };

export function getGuestShortlist(): GuestEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as GuestEntry[];
  } catch {
    return [];
  }
}

export function addToGuestShortlist(collegeId: string): void {
  const list = getGuestShortlist();
  if (!list.some((e) => e.collegeId === collegeId)) {
    list.push({ collegeId });
    localStorage.setItem(KEY, JSON.stringify(list));
  }
}

export function removeFromGuestShortlist(collegeId: string): void {
  const list = getGuestShortlist().filter((e) => e.collegeId !== collegeId);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function isInGuestShortlist(collegeId: string): boolean {
  return getGuestShortlist().some((e) => e.collegeId === collegeId);
}

/** Emit a custom event so all components stay in sync */
export function dispatchShortlistChange() {
  window.dispatchEvent(new Event("guest-shortlist-change"));
}
```

## 5.9 Shortlist Button Component
**File:** `src/components/ShortlistButton.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import {
  getGuestShortlist,
  addToGuestShortlist,
  removeFromGuestShortlist,
  isInGuestShortlist,
  dispatchShortlistChange,
} from "@/lib/guestShortlist";

type Props = {
  collegeId: string;
  variant?: "primary" | "secondary";
};

export default function ShortlistButton({ collegeId, variant = "secondary" }: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync from localStorage on mount and when other components change the list
  useEffect(() => {
    setSaved(isInGuestShortlist(collegeId));

    const handler = () => setSaved(isInGuestShortlist(collegeId));
    window.addEventListener("guest-shortlist-change", handler);
    return () => window.removeEventListener("guest-shortlist-change", handler);
  }, [collegeId]);

  function toggle() {
    setLoading(true);
    if (saved) {
      removeFromGuestShortlist(collegeId);
      setSaved(false);
    } else {
      addToGuestShortlist(collegeId);
      setSaved(true);
    }
    dispatchShortlistChange();
    setLoading(false);
  }

  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      style={{
        padding: "9px 18px",
        border: isPrimary ? "none" : "1.5px solid #DDDDDD",
        background: saved ? "#FFF1F2" : isPrimary ? "#FF385C" : "#fff",
        color: saved ? "#FF385C" : isPrimary ? "#fff" : "#717171",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!saved && !isPrimary) e.currentTarget.style.borderColor = "#222222";
      }}
      onMouseLeave={(e) => {
        if (!saved && !isPrimary) e.currentTarget.style.borderColor = "#DDDDDD";
      }}
    >
      {saved ? "★ Shortlisted" : "☆ Add to Shortlist"}
    </button>
  );
}
```

## 5.10 AuthGate Component
**File:** `src/components/AuthGate.tsx`

```tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Feature = "Compare" | "Predictor" | "Shortlist";

const FEATURE_INFO: Record<Feature, { icon: string; title: string; desc: string; bullets: string[] }> = {
  Compare: {
    icon: "⚖️",
    title: "Compare Colleges Side-by-Side",
    desc: "See which college wins across placement, fees, location and more — with live weighted scoring.",
    bullets: [
      "Visual winner highlights per metric",
      "Adjust weights: Placement vs Fees vs Location",
      "Best Match badge that updates live",
      "Highlight only the rows that differ",
    ],
  },
  Predictor: {
    icon: "🎯",
    title: "Personalised Admission Predictor",
    desc: "Enter your JEE / MHT-CET / KCET score and see your realistic chances at every college.",
    bullets: [
      "Based on 3 years of real cutoff data",
      "High / Medium / Low probability bands",
      "Covers 7+ entrance exams",
      "Grouped by chance — not just a list",
    ],
  },
  Shortlist: {
    icon: "★",
    title: "Your Personal Shortlist",
    desc: "All the colleges you've saved, synced to your account so they never disappear.",
    bullets: [
      "Access your shortlist from any device",
      "Compare all shortlisted colleges in one click",
      "Track fees, packages and ranks at a glance",
      "Remove colleges as your search narrows",
    ],
  },
};

function Skeleton() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "50%",
        border: "3px solid #DDDDDD", borderTopColor: "#FF385C",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AuthGate({ feature, children }: { feature: Feature; children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const info = FEATURE_INFO[feature];

  if (status === "loading") return <Skeleton />;

  if (status === "authenticated") return <>{children}</>;

  // Auth wall
  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      background: "#fff",
    }}>
      <div style={{
        maxWidth: "460px",
        width: "100%",
        textAlign: "center",
      }}>
        {/* Icon */}
        <div style={{ fontSize: "52px", marginBottom: "20px", lineHeight: 1 }}>{info.icon}</div>

        {/* Heading */}
        <h1 style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          color: "#222222",
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
          marginBottom: "12px",
        }}>
          {info.title}
        </h1>

        <p style={{ fontSize: "15px", color: "#717171", lineHeight: 1.6, marginBottom: "28px" }}>
          {info.desc}
        </p>

        {/* Bullets */}
        <div style={{
          background: "#F7F7F7",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "28px",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          {info.bullets.map((b) => (
            <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "#222222" }}>
              <span style={{ color: "#FF385C", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>✓</span>
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
          style={{
            display: "block",
            width: "100%",
            padding: "14px",
            background: "#FF385C",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.2s ease",
            marginBottom: "12px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E31C5F")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FF385C")}
        >
          Sign in to continue
        </Link>

        <Link
          href="/login?tab=register"
          style={{ fontSize: "13px", color: "#717171", textDecoration: "underline" }}
        >
          New here? Create a free account
        </Link>

        {/* Back link */}
        <div style={{ marginTop: "24px" }}>
          <Link href="/" style={{ fontSize: "13px", color: "#AAAAAA" }}>
            ← Back to college search
          </Link>
        </div>
      </div>
    </div>
  );
}
```

## 5.11 Proxy / Middleware
**File:** `src/proxy.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/shortlist", "/shortlist/:path*"],
};
```

# 6. Database

## 6.1 Latest SQL Migration (v2)
**File:** `prisma/migrations/20260525131209_relational_schema_v2/migration.sql`

```sql
-- CreateEnum
CREATE TYPE "CollegeType" AS ENUM ('GOVT', 'PRIVATE', 'DEEMED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "type" "CollegeType" NOT NULL,
    "streams" TEXT[],
    "nirfRank" INTEGER,
    "established" INTEGER NOT NULL,
    "website" TEXT,
    "accreditation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseFee" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "annualFee" INTEGER NOT NULL,

    CONSTRAINT "CourseFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementStat" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "avgPackage" DOUBLE PRECISION NOT NULL,
    "maxPackage" DOUBLE PRECISION NOT NULL,
    "placementPct" DOUBLE PRECISION NOT NULL,
    "topRecruiters" TEXT[],

    CONSTRAINT "PlacementStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionCutoff" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "exam" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "cutoffValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AdmissionCutoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "batchYear" INTEGER NOT NULL,
    "stream" TEXT NOT NULL,
    "ratingOverall" DOUBLE PRECISION NOT NULL,
    "ratingPlacement" DOUBLE PRECISION NOT NULL,
    "ratingFaculty" DOUBLE PRECISION NOT NULL,
    "ratingInfra" DOUBLE PRECISION NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shortlist" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCollege" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCollege_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "College_slug_key" ON "College"("slug");

-- CreateIndex
CREATE INDEX "CourseFee_collegeId_idx" ON "CourseFee"("collegeId");

-- CreateIndex
CREATE INDEX "PlacementStat_collegeId_idx" ON "PlacementStat"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementStat_collegeId_year_key" ON "PlacementStat"("collegeId", "year");

-- CreateIndex
CREATE INDEX "AdmissionCutoff_collegeId_idx" ON "AdmissionCutoff"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionCutoff_collegeId_exam_year_category_key" ON "AdmissionCutoff"("collegeId", "exam", "year", "category");

-- CreateIndex
CREATE INDEX "Review_collegeId_status_idx" ON "Review"("collegeId", "status");

-- CreateIndex
CREATE INDEX "Shortlist_sessionId_idx" ON "Shortlist"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Shortlist_sessionId_collegeId_key" ON "Shortlist"("sessionId", "collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCollege_userId_collegeId_key" ON "SavedCollege"("userId", "collegeId");

-- AddForeignKey
ALTER TABLE "CourseFee" ADD CONSTRAINT "CourseFee_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementStat" ADD CONSTRAINT "PlacementStat_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionCutoff" ADD CONSTRAINT "AdmissionCutoff_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCollege" ADD CONSTRAINT "SavedCollege_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCollege" ADD CONSTRAINT "SavedCollege_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

# 7. Frontend

## 7.1 Main College Listing Page
**File:** `src/app/page.tsx`

```tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import CollegeCard from "@/components/CollegeCard";
import SkeletonCard from "@/components/SkeletonCard";
import Toast from "@/components/Toast";
import {
  getGuestShortlist,
  addToGuestShortlist,
  removeFromGuestShortlist,
  dispatchShortlistChange,
} from "@/lib/guestShortlist";

// ─── Types ───────────────────────────────────────────────────────────────────

type College = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  type: "GOVT" | "PRIVATE" | "DEEMED";
  streams: string[];
  nirfRank: number | null;
  minAnnualFee: number | null;
  avgPackage: number | null;
  maxPackage: number | null;
  placementPct: number | null;
};

type ApiResponse = {
  data: College[];
  total: number;
  page: number;
  totalPages: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STREAMS = ["Engineering", "Medical", "Commerce", "Law", "Sciences", "Management"];
const TYPES   = [
  { label: "All Types", value: "" },
  { label: "Government", value: "GOVT" },
  { label: "Private",    value: "PRIVATE" },
  { label: "Deemed",     value: "DEEMED" },
];
const SORT_OPTIONS = [
  { label: "NIRF Rank",         value: "nirf" },
  { label: "Avg Placement ↑",   value: "placement" },
  { label: "Fees: Low to High", value: "fees_asc" },
  { label: "Fees: High to Low", value: "fees_desc" },
];
const LIMIT = 9;

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const [colleges,    setColleges]    = useState<College[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [savedIds,    setSavedIds]    = useState<Set<string>>(new Set());
  const [toast,       setToast]       = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Filters
  const [search,     setSearch]      = useState("");
  const [stream,     setStream]      = useState("");
  const [cityFilter, setCityFilter]  = useState("");
  const [typeFilter, setTypeFilter]  = useState("");
  const [feesMax,    setFeesMax]     = useState("");
  const [sort,       setSort]        = useState("nirf");
  const [showMore,   setShowMore]    = useState(false);

  // Debounced search
  const searchTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Fetch colleges
  const fetchColleges = useCallback(async () => {
    setLoading(true);
    setError("");
    const p = new URLSearchParams({
      page:  String(page),
      limit: String(LIMIT),
      sort,
    });
    if (debouncedSearch) p.set("search",   debouncedSearch);
    if (stream)          p.set("stream",   stream);
    if (cityFilter)      p.set("city",     cityFilter);
    if (typeFilter)      p.set("type",     typeFilter);
    if (feesMax)         p.set("fees_max", feesMax);

    try {
      const res  = await fetch(`/api/colleges?${p.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: ApiResponse = await res.json();
      setColleges(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load colleges. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, stream, cityFilter, typeFilter, feesMax, sort]);

  useEffect(() => { fetchColleges(); }, [fetchColleges]);

  // Load shortlisted colleges from localStorage
  useEffect(() => {
    const sync = () => {
      const list = getGuestShortlist();
      setSavedIds(new Set(list.map((e) => e.collegeId)));
    };
    sync();
    window.addEventListener("guest-shortlist-change", sync);
    return () => window.removeEventListener("guest-shortlist-change", sync);
  }, []);

  function handleSaveToggle(collegeId: string, save: boolean) {
    if (save) {
      addToGuestShortlist(collegeId);
      setSavedIds((prev) => new Set([...prev, collegeId]));
      setToast({ message: "Added to shortlist ★", type: "success" });
    } else {
      removeFromGuestShortlist(collegeId);
      setSavedIds((prev) => { const n = new Set(prev); n.delete(collegeId); return n; });
      setToast({ message: "Removed from shortlist", type: "info" });
    }
    dispatchShortlistChange();
  }

  function clearFilters() {
    setSearch(""); setDebouncedSearch(""); setStream(""); setCityFilter("");
    setTypeFilter(""); setFeesMax(""); setSort("nirf"); setPage(1);
  }

  const activeFilterCount = [stream, cityFilter, typeFilter, feesMax].filter(Boolean).length;

  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />

      {/* ── SEARCH HEADER ── */}
      <section className="search-header">
        <h1 className="page-title">Find Your College</h1>
        <p className="page-subtitle">
          Search, compare and shortlist from 22+ top Indian colleges
        </p>
        <div className="search-bar-wrapper">
          <input
            id="college-search"
            type="text"
            placeholder="Search by college name, city or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            autoComplete="off"
          />
        </div>
      </section>

      {/* ── FILTERS + RESULTS ── */}
      <section className="content-section">

        {/* Stream chips */}
        <div className="filter-bar">
          <div className="stream-chips">
            <button
              onClick={() => { setStream(""); setPage(1); }}
              className={stream === "" ? "chip chip--active" : "chip"}
            >
              All Streams
            </button>
            {STREAMS.map((s) => (
              <button
                key={s}
                onClick={() => { setStream(stream === s ? "" : s); setPage(1); }}
                className={stream === s ? "chip chip--active" : "chip"}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="filter-right">
            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="filter-select"
              id="type-filter"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="filter-select"
              id="sort-select"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* More filters toggle */}
            <button
              onClick={() => setShowMore(!showMore)}
              className={activeFilterCount > 0 || showMore ? "chip chip--active" : "chip"}
              id="more-filters-btn"
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="chip chip--clear">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Expandable filter panel */}
        {showMore && (
          <div className="filter-panel">
            <div className="filter-group">
              <label className="filter-label" htmlFor="city-input">City</label>
              <input
                id="city-input"
                type="text"
                placeholder="e.g. Mumbai"
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="fees-input">Max Annual Fees (₹)</label>
              <input
                id="fees-input"
                type="number"
                placeholder="e.g. 200000"
                value={feesMax}
                onChange={(e) => { setFeesMax(e.target.value); setPage(1); }}
                className="filter-input"
              />
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="results-header">
          <h2 className="results-count">
            {loading ? "Loading..." : `${total} College${total !== 1 ? "s" : ""}`}
          </h2>
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">
            {error}{" "}
            <button onClick={fetchColleges} className="error-retry">Retry</button>
          </div>
        )}

        {/* College grid */}
        <div className="college-grid">
          {loading
            ? [...Array(LIMIT)].map((_, i) => <SkeletonCard key={i} />)
            : colleges.length > 0
            ? colleges.map((college) => (
                <CollegeCard
                  key={college.id}
                  {...college}
                  isSaved={savedIds.has(college.id)}
                  onSaveToggle={handleSaveToggle}
                />
              ))
            : !error && (
                <div className="empty-state">
                  <p className="empty-title">No colleges found</p>
                  <p className="empty-sub">Try adjusting your filters</p>
                  <button onClick={clearFilters} className="btn-link">
                    Clear all filters
                  </button>
                </div>
              )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="page-btn"
            >
              ← Prev
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={page === p ? "page-btn page-btn--active" : "page-btn"}
                  >
                    {p}
                  </button>
                );
              }
              if (Math.abs(p - page) === 2) return <span key={p} className="page-ellipsis">…</span>;
              return null;
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="page-btn"
            >
              Next →
            </button>
          </div>
        )}
      </section>


      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </main>
  );
}
```

## 7.2 College Detail Page
**File:** `src/app/colleges/[slug]/page.tsx`

```tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import PlacementsSection from "./PlacementsSection";
import ReviewsSection from "./ReviewsSection";
import CutoffsSection from "./CutoffsSection";
import CareerTrendsSection from "./CareerTrendsSection";
import ShortlistButton from "@/components/ShortlistButton";

// ── Types ──────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const college = await prisma.college.findUnique({ where: { slug } });
  if (!college) return { title: "College Not Found" };
  return {
    title: `${college.name} — Fees, Placements & Reviews | CollegeScout`,
    description: `Explore ${college.name} in ${college.city}: courses, fees, placement packages, cutoffs, and student reviews.`,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function CollegeDetailPage({ params }: Props) {
  const { slug } = await params;

  const college = await prisma.college.findUnique({
    where: { slug },
    include: {
      courseFees:       { orderBy: { annualFee: "asc" } },
      placementStats:   { orderBy: { year: "desc" } },
      admissionCutoffs: { orderBy: [{ year: "desc" }, { exam: "asc" }, { category: "asc" }] },
      reviews: {
        where:   { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take:    10,
      },
    },
  });

  if (!college) notFound();

  const latestPlacement = college.placementStats[0] ?? null;
  const minFee          = college.courseFees[0]?.annualFee ?? null;

  const reviewCount = await prisma.review.count({
    where: { collegeId: college.id, status: "APPROVED" },
  });

  const TYPE_LABEL: Record<string, string> = {
    GOVT: "Government", PRIVATE: "Private", DEEMED: "Deemed",
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px 80px" }}>

          {/* Breadcrumb */}
          <nav style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "20px" }}>
            <Link href="/" style={{ color: "#FF385C" }}>Colleges</Link>
            <span style={{ margin: "0 6px" }}>›</span>
            <span>{college.name}</span>
          </nav>

          {/* ── HEADER ── */}
          <div style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              {college.nirfRank && (
                <span style={styles.badge("#FFF1F2", "#FF385C", "rgba(255,56,92,0.25)")}>
                  NIRF #{college.nirfRank}
                </span>
              )}
              <span style={styles.badge("#F9FAFB", "#374151", "#E5E7EB")}>
                {TYPE_LABEL[college.type] ?? college.type}
              </span>
              {college.accreditation && (
                <span style={styles.badge("#F0FDF4", "#15803D", "#BBF7D0")}>
                  {college.accreditation}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#222222", lineHeight: 1.2, marginBottom: "8px" }}>
              {college.name}
            </h1>
            <p style={{ fontSize: "15px", color: "#717171" }}>
              {college.city}, {college.state} &nbsp;·&nbsp; Est. {college.established}
              {college.website && (
                <>
                  &nbsp;·&nbsp;
                  <a href={college.website} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#FF385C" }}>
                    Website ↗
                  </a>
                </>
              )}
            </p>

            {/* Streams */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
              {college.streams.map((s) => (
                <span key={s} style={styles.badge("#F0FDF4", "#16A34A", "#BBF7D0")}>{s}</span>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap", alignItems: "center" }}>
              <Link href={`/compare?ids=${college.slug}`} style={styles.btnPrimary}>
                ⚖️ Compare
              </Link>
              <ShortlistButton collegeId={college.id} />
              <Link href="/" style={styles.btnSecondary}>← Back to Search</Link>
            </div>
          </div>

          {/* ── QUICK STATS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "40px" }}>
            <QuickStat label="Min Annual Fee" value={minFee ? `₹${(minFee / 100000).toFixed(1)}L` : "N/A"} />
            <QuickStat
              label="Avg Package"
              value={latestPlacement ? `₹${latestPlacement.avgPackage} LPA` : "N/A"}
              sub={latestPlacement ? `${latestPlacement.year}` : undefined}
            />
            <QuickStat
              label="Highest Package"
              value={latestPlacement ? `₹${latestPlacement.maxPackage} LPA` : "N/A"}
            />
            <QuickStat
              label="Placement %"
              value={latestPlacement ? `${latestPlacement.placementPct}%` : "N/A"}
            />
          </div>

          {/* ── COURSES & FEES ── */}
          <Section title="Courses & Fees">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {college.courseFees.map((cf) => (
                <div key={cf.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", border: "1px solid #DDDDDD", borderRadius: "12px",
                  fontSize: "14px",
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "#222222" }}>{cf.course}</span>
                    <span style={{ color: "#717171", marginLeft: "8px" }}>{cf.degree}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: "#FF385C", whiteSpace: "nowrap" }}>
                    ₹{cf.annualFee.toLocaleString("en-IN")}<span style={{ fontWeight: 400, color: "#9CA3AF", fontSize: "12px" }}>/yr</span>
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── PLACEMENTS ── */}
          {college.placementStats.length > 0 && (
            <Section title="Placements">
              <PlacementsSection stats={college.placementStats} />
            </Section>
          )}

          {college.placementStats.length > 0 && (
            <Section title="Career Trends">
              <CareerTrendsSection collegeSlug={college.slug} />
            </Section>
          )}

          {/* ── ADMISSION CUTOFFS ── */}
          {college.admissionCutoffs.length > 0 && (
            <Section title="Admission Cutoffs">
              <CutoffsSection cutoffs={college.admissionCutoffs} />
            </Section>
          )}

          {/* ── REVIEWS ── */}
          <Section title={`Student Reviews${reviewCount > 0 ? ` (${reviewCount})` : ""}`}>
            <ReviewsSection
              collegeSlug={college.slug}
              initialReviews={college.reviews.map((r) => ({
                ...r,
                createdAt: r.createdAt.toISOString(),
              }))}
            />
          </Section>

        </div>
      </main>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function QuickStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      border: "1px solid #DDDDDD", borderRadius: "12px", padding: "16px",
      textAlign: "center",
    }}>
      <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#AAAAAA", marginBottom: "6px" }}>
        {label}
      </p>
      <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#222222" }}>{value}</p>
      {sub && <p style={{ fontSize: "11px", color: "#AAAAAA", marginTop: "2px" }}>{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <h2 style={{
        fontSize: "1.1rem", fontWeight: 700, color: "#222222",
        paddingBottom: "12px", borderBottom: "1px solid #DDDDDD", marginBottom: "20px",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

const styles = {
  badge: (bg: string, color: string, border: string): React.CSSProperties => ({
    display: "inline-block", padding: "3px 9px", borderRadius: "4px",
    fontSize: "11px", fontWeight: 600, background: bg, color, border: `1px solid ${border}`,
  }),
  btnPrimary: {
    padding: "9px 18px", background: "#FF385C", color: "#fff",
    borderRadius: "12px", fontSize: "14px", fontWeight: 600,
  } as React.CSSProperties,
  btnSecondary: {
    padding: "9px 18px", border: "1.5px solid #DDDDDD", color: "#222222",
    borderRadius: "12px", fontSize: "14px", background: "#fff",
  } as React.CSSProperties,
};
```

## 7.3 Legacy College Detail Redirect Page
**File:** `src/app/college/[id]/page.tsx`

```tsx
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

/** Legacy route — redirect to canonical /colleges/[slug] */
export default async function LegacyCollegePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const college = await prisma.college.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { slug: true },
  });

  if (!college) notFound();
  redirect(`/colleges/${college.slug}`);
}
```

## 7.4 Predictor Page
**File:** `src/app/predictor/page.tsx`

```tsx
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type PredictorResult = {
  collegeId:         string;
  slug:              string;
  name:              string;
  city:              string;
  nirfRank:          number | null;
  lastClosingRank:   number;
  cutoffYear:        number;
  probability:       "high" | "medium" | "low";
  avgPackage:        number | null;
  minFee:            number | null;
};

type PredictorResponse = {
  exam:       string;
  percentile: number;
  category:   string;
  results:    PredictorResult[];
};

// ── Config ─────────────────────────────────────────────────────────────────

const EXAMS = [
  { label: "JEE Advanced",  value: "JEE Advanced",  type: "rank",  placeholder: "e.g. 500 (rank)" },
  { label: "JEE Main",      value: "JEE Main",      type: "rank",  placeholder: "e.g. 5000 (rank)" },
  { label: "MHT-CET",       value: "MHT-CET",       type: "pct",   placeholder: "e.g. 99.2 (percentile)" },
  { label: "BITSAT",        value: "BITSAT",         type: "score", placeholder: "e.g. 350 (score)" },
  { label: "VITEEE",        value: "VITEEE",         type: "rank",  placeholder: "e.g. 1000 (rank)" },
  { label: "KCET",          value: "KCET",           type: "rank",  placeholder: "e.g. 2000 (rank)" },
  { label: "WBJEE",         value: "WBJEE",          type: "rank",  placeholder: "e.g. 3000 (rank)" },
];

const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"];

const PROB_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  high:   { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "✅ High" },
  medium: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", label: "⚡ Medium" },
  low:    { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", label: "🎯 Low" },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function PredictorPage() {
  const [exam,       setExam]       = useState(EXAMS[0].value);
  const [percentile, setPercentile] = useState("");
  const [category,   setCategory]   = useState("General");
  const [results,    setResults]    = useState<PredictorResult[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [searched,   setSearched]   = useState(false);

  const selectedExam = EXAMS.find((e) => e.value === exam) ?? EXAMS[0];

  async function handlePredict() {
    if (!percentile || !exam) return;
    setLoading(true);
    setError("");
    setResults([]);
    setSearched(false);

    try {
      const params = new URLSearchParams({ exam, percentile, category });
      const res    = await fetch(`/api/predictor?${params.toString()}`);
      const data   = await res.json() as PredictorResponse | { error: string };

      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Prediction failed");
      } else {
        setResults(data.results);
        setSearched(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const high   = results.filter((r) => r.probability === "high");
  const medium  = results.filter((r) => r.probability === "medium");
  const low     = results.filter((r) => r.probability === "low");

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
              Admission Predictor
            </h1>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px" }}>
              Enter your exam score to see which colleges are safe, moderate, or reach for you.
            </p>
          </div>

          {/* ── INPUT FORM ── */}
          <div style={{
            border: "1px solid #E5E7EB", borderRadius: "12px",
            padding: "24px", marginBottom: "32px",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>

              {/* Exam */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Entrance Exam</label>
                <select
                  value={exam}
                  onChange={(e) => { setExam(e.target.value); setResults([]); setSearched(false); }}
                  style={{
                    padding: "10px 12px", border: "1.5px solid #E5E7EB",
                    borderRadius: "8px", fontSize: "14px", color: "#111827",
                    background: "#fff", outline: "none", cursor: "pointer",
                  }}
                >
                  {EXAMS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>

              {/* Score/Rank/Percentile */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>
                  Your {selectedExam.type === "rank" ? "Rank" : selectedExam.type === "score" ? "Score" : "Percentile"}
                </label>
                <input
                  type="number"
                  value={percentile}
                  onChange={(e) => setPercentile(e.target.value)}
                  placeholder={selectedExam.placeholder}
                  style={{
                    padding: "10px 12px", border: "1.5px solid #E5E7EB",
                    borderRadius: "8px", fontSize: "14px", color: "#111827",
                    background: "#fff", outline: "none",
                  }}
                />
              </div>

              {/* Category */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    padding: "10px 12px", border: "1.5px solid #E5E7EB",
                    borderRadius: "8px", fontSize: "14px", color: "#111827",
                    background: "#fff", outline: "none", cursor: "pointer",
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handlePredict}
              disabled={!percentile || !exam || loading}
              style={{
                padding: "10px 24px", background: (!percentile || loading) ? "#FFBDCA" : "#FF385C",
                color: "#fff", borderRadius: "12px", fontSize: "14px",
                fontWeight: 600, border: "none",
                cursor: (!percentile || loading) ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Predicting…" : "Predict My Colleges →"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#DC2626", borderRadius: "8px",
              padding: "12px 16px", marginBottom: "24px", fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {/* ── RESULTS ── */}
          {searched && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF", fontSize: "14px" }}>
              No colleges found for this exam/score. Try a different exam or score.
            </div>
          )}

          {results.length > 0 && (
            <>
              {/* Summary pills */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                {[
                  { label: "✅ High",   count: high.length,   color: "#16A34A" },
                  { label: "⚡ Medium", count: medium.length, color: "#D97706" },
                  { label: "🎯 Low",    count: low.length,    color: "#DC2626" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{
                    padding: "8px 16px", borderRadius: "20px",
                    border: `1px solid ${color}22`, background: `${color}11`,
                    fontSize: "13px", fontWeight: 600, color,
                  }}>
                    {label}: {count} college{count !== 1 ? "s" : ""}
                  </div>
                ))}
              </div>

              {/* Groups */}
              {[
                { title: "High Probability",   data: high,   prob: "high"   as const },
                { title: "Medium Probability",  data: medium, prob: "medium" as const },
                { title: "Low Probability",     data: low,    prob: "low"    as const },
              ].filter((g) => g.data.length > 0).map((group) => (
                <div key={group.prob} style={{ marginBottom: "32px" }}>
                  <h2 style={{
                    fontSize: "15px", fontWeight: 700, color: PROB_STYLES[group.prob].color,
                    marginBottom: "12px",
                  }}>
                    {group.title} ({group.data.length})
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {group.data.map((r) => (
                      <CollegeResultCard key={r.collegeId} result={r} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Empty state */}
          {!searched && !loading && (
            <div style={{ textAlign: "center", padding: "48px", color: "#9CA3AF" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎓</div>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#374151" }}>
                Enter your exam details above
              </p>
              <p style={{ fontSize: "14px", marginTop: "4px" }}>
                We'll show you safe, moderate, and reach colleges based on 3 years of cutoff data
              </p>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

// ── College Result Card ─────────────────────────────────────────────────────

function CollegeResultCard({ result }: { result: PredictorResult }) {
  const style = PROB_STYLES[result.probability];
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 20px", border: `1px solid ${style.border}`,
      borderRadius: "10px", background: style.bg, gap: "12px", flexWrap: "wrap",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Link href={`/colleges/${result.slug}`} style={{
            fontSize: "15px", fontWeight: 700, color: "#111827",
          }}>
            {result.name}
          </Link>
          {result.nirfRank && (
            <span style={{
              fontSize: "11px", fontWeight: 700, background: "#FFF1F2",
              color: "#FF385C", border: "1px solid rgba(255,56,92,0.25)",
              borderRadius: "6px", padding: "1px 6px",
            }}>
              NIRF #{result.nirfRank}
            </span>
          )}
        </div>
        <p style={{ fontSize: "12px", color: "#6B7280" }}>{result.city}</p>
        <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>
          Last closing rank ({result.cutoffYear}, any branch):{" "}
          <strong>{result.lastClosingRank.toLocaleString("en-IN")}</strong>
        </p>
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
        {result.avgPackage && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: "#6B7280" }}>Avg Package</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>₹{result.avgPackage} LPA</p>
          </div>
        )}
        {result.minFee && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: "#6B7280" }}>Min Fee</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>₹{(result.minFee / 100000).toFixed(1)}L/yr</p>
          </div>
        )}
        <span style={{
          padding: "6px 14px", borderRadius: "20px",
          background: style.color, color: "#fff",
          fontSize: "12px", fontWeight: 700,
        }}>
          {style.label}
        </span>
      </div>
    </div>
  );
}
```

## 7.5 Compare Page
**File:** `src/app/compare/page.tsx`

```tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────

type CollegeOption = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
};

type PlacementStat = {
  year: number;
  avgPackage: number;
  maxPackage: number;
  placementPct: number;
  topRecruiters: string[];
};

type CourseFee = {
  course: string;
  degree: string;
  annualFee: number;
};

type Cutoff = {
  exam: string;
  year: number;
  category: string;
  cutoffValue: number;
};

type ComparedCollege = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  type: string;
  streams: string[];
  nirfRank: number | null;
  established: number;
  accreditation: string | null;
  minAnnualFee: number | null;
  allFees: CourseFee[];
  placement: PlacementStat | null;
  cutoffs: Cutoff[];
  avgRating: number | null;
  reviewCount: number;
};

// ── Slider Component ────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color }}>
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
        style={{ accentColor: color, width: "100%", cursor: "pointer" }}
      />
    </div>
  );
}

// ── Main Content ────────────────────────────────────────────────────────────

function CompareContent() {
  const searchParams = useSearchParams();
  const preloadSlug  = searchParams.get("ids")?.split(",")[0] ?? "";

  const [allColleges, setAllColleges] = useState<CollegeOption[]>([]);
  const [slug1,       setSlug1]       = useState(preloadSlug);
  const [slug2,       setSlug2]       = useState("");
  const [slug3,       setSlug3]       = useState("");
  const [compared,    setCompared]    = useState<ComparedCollege[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(true);
  const [error,       setError]       = useState("");

  // Weight sliders
  const [wPlacement, setWPlacement] = useState(0.6);
  const [wFees,      setWFees]      = useState(0.3);
  const [wLocation,  setWLocation]  = useState(0.1);

  // Normalise weights so they always sum to 1
  const total      = wPlacement + wFees + wLocation || 1;
  const weights    = { placement: wPlacement / total, fees: wFees / total, location: wLocation / total };

  // Scores (0–100)
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/colleges?limit=50")
      .then((r) => r.json())
      .then((d) => { setAllColleges(d.data ?? []); setFetching(false); })
      .catch(() => setFetching(false));
  }, []);

  async function handleCompare() {
    const slugs = [slug1, slug2, slug3].filter(Boolean);
    if (slugs.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/colleges/compare?ids=${slugs.join(",")}`);
      const data = await res.json() as { colleges?: ComparedCollege[]; error?: string };
      if (!res.ok || !data.colleges) {
        setError(data.error ?? "Failed to fetch comparison");
        setCompared([]);
      } else {
        setCompared(data.colleges);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Re-score whenever weights or colleges change
  useEffect(() => {
    if (compared.length === 0) return;

    const pkgs   = compared.map((c) => c.placement?.avgPackage ?? 0);
    const fees   = compared.map((c) => c.minAnnualFee ?? 0);
    const ranks  = compared.map((c) => c.nirfRank ?? 999);

    const minPkg = Math.min(...pkgs), maxPkg = Math.max(...pkgs);
    const minFee = Math.min(...fees), maxFee = Math.max(...fees);
    const minRnk = Math.min(...ranks), maxRnk = Math.max(...ranks);

    const norm = (v: number, lo: number, hi: number) =>
      hi === lo ? 0.5 : (v - lo) / (hi - lo);

    const tier1Cities = ["mumbai", "bangalore", "delhi", "hyderabad", "pune"];
const newScores: Record<string, number> = {};
for (const c of compared) {
  const p = norm(c.placement?.avgPackage ?? 0, minPkg, maxPkg);
  const f = 1 - norm(c.minAnnualFee ?? 0, minFee, maxFee);
  const l = tier1Cities.some((city) => c.city.toLowerCase().includes(city)) ? 1 : 0.5;
  newScores[c.id] = Math.round((weights.placement * p + weights.fees * f + weights.location * l) * 1000) / 10;
}
    setScores(newScores);
  }, [compared, weights.placement, weights.fees, weights.location]);

  const ranked = [...compared].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const best   = (key: "avgPackage" | "minAnnualFee" | "nirfRank", mode: "higher" | "lower") => {
    if (compared.length < 2) return null;
    const vals = compared.map((c) => ({
      id: c.id,
      v:  key === "avgPackage" ? (c.placement?.avgPackage ?? null)
        : key === "minAnnualFee" ? c.minAnnualFee
        : c.nirfRank,
    })).filter((x) => x.v != null);
    if (vals.length < 2) return null;
    return mode === "higher"
      ? vals.reduce((a, b) => ((a.v ?? 0) > (b.v ?? 0) ? a : b)).id
      : vals.reduce((a, b) => ((a.v ?? 999999) < (b.v ?? 999999) ? a : b)).id;
  };

  const bestPkg  = best("avgPackage",   "higher");
  const bestFee  = best("minAnnualFee", "lower");
  const bestNirf = best("nirfRank",     "lower");

  const scoreColors = ["#FF385C", "#16A34A", "#D97706"];

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
              Compare Colleges
            </h1>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px" }}>
              Select up to 3 colleges and adjust weights to see your personalised ranking
            </p>
          </div>

          {/* ── COLLEGE SELECTORS ── */}
          <div style={{
            border: "1px solid #E5E7EB", borderRadius: "12px",
            padding: "20px 24px", marginBottom: "24px", background: "#fff",
          }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
              {[
                { val: slug1, set: setSlug1, label: "College 1" },
                { val: slug2, set: setSlug2, label: "College 2" },
                { val: slug3, set: setSlug3, label: "College 3 (optional)" },
              ].map(({ val, set, label }) => (
                <div key={label} style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>{label}</label>
                  <select
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    disabled={fetching}
                    style={{
                      padding: "9px 12px", border: "1.5px solid #E5E7EB",
                      borderRadius: "8px", fontSize: "14px", color: "#111827",
                      background: "#fff", outline: "none", cursor: "pointer",
                    }}
                  >
                    <option value="">{fetching ? "Loading…" : `-- ${label} --`}</option>
                    {allColleges
                      .filter((c) => !([slug1, slug2, slug3].filter((s) => s !== val).includes(c.slug)))
                      .map((c) => (
                        <option key={c.id} value={c.slug}>{c.name}</option>
                      ))}
                  </select>
                </div>
              ))}

              <button
                onClick={handleCompare}
                disabled={!slug1 || !slug2 || loading}
                style={{
                  padding: "9px 22px", borderRadius: "8px", fontSize: "14px",
                  fontWeight: 600, border: "none", cursor: (!slug1 || !slug2) ? "not-allowed" : "pointer",
                  background: (!slug1 || !slug2) ? "#FFBDCA" : "#FF385C",
                  color: "#fff", flexShrink: 0,
                }}
              >
                {loading ? "Loading…" : "Compare →"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626",
              borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {/* ── WEIGHT SLIDERS ── */}
          {compared.length >= 2 && (
            <div style={{
              border: "1px solid #E5E7EB", borderRadius: "12px",
              padding: "20px 24px", marginBottom: "24px",
            }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
                Adjust Your Priorities
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                <Slider label="Placement Package" value={wPlacement} onChange={setWPlacement} color="#FF385C" />
                <Slider label="Affordability (fees)" value={wFees} onChange={setWFees} color="#16A34A" />
                <Slider label="Location Preference" value={wLocation} onChange={setWLocation} color="#D97706" />              </div>
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "12px" }}>
              Weights auto-normalise to 100% · {Math.round(weights.placement * 100)}% placement + {Math.round(weights.fees * 100)}% fees + {Math.round(weights.location * 100)}% location              </p>
            </div>
          )}

          {/* ── SCORE CARDS ── */}
          {ranked.length >= 2 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${ranked.length}, 1fr)`, gap: "12px", marginBottom: "28px" }}>
              {ranked.map((c, i) => (
                <div key={c.id} style={{
                  border: `2px solid ${i === 0 ? scoreColors[0] : "#DDDDDD"}`,
                  borderRadius: "12px", padding: "20px",
                  background: i === 0 ? "#FFF1F2" : "#fff",
                }}>
                  {i === 0 && (
                    <div style={{
                      display: "inline-block", fontSize: "11px", fontWeight: 700,
                      background: "#FF385C", color: "#fff", borderRadius: "6px",
                      padding: "2px 8px", marginBottom: "8px",
                    }}>
                      #1 Best Match
                    </div>
                  )}
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
                    {c.name}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>
                    {c.city}, {c.state}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 800, color: scoreColors[i] ?? "#374151" }}>
                      {(scores[c.id] ?? 0).toFixed(1)}
                    </span>
                    <span style={{ fontSize: "13px", color: "#9CA3AF" }}>/ 100</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>Weighted score</p>
                </div>
              ))}
            </div>
          )}

          {/* ── COMPARISON TABLE ── */}
          {compared.length >= 2 && (
            <div style={{
              border: "1px solid #E5E7EB", borderRadius: "12px",
              overflow: "hidden", marginBottom: "24px",
            }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: `200px repeat(${compared.length}, 1fr)`,
                background: "#F9FAFB",
                borderBottom: "1px solid #E5E7EB",
                padding: "14px 20px",
              }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Metric
                </span>
                {compared.map((c) => (
                  <span key={c.id} style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                    {c.name}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {[
                {
                  label: "NIRF Rank",
                  values: compared.map((c) => c.nirfRank ? `#${c.nirfRank}` : "N/A"),
                  bestId: bestNirf,
                },
                {
                  label: "Type",
                  values: compared.map((c) => c.type === "GOVT" ? "Government" : c.type === "PRIVATE" ? "Private" : "Deemed"),
                  bestId: null,
                },
                {
                  label: "Established",
                  values: compared.map((c) => String(c.established)),
                  bestId: null,
                },
                {
                  label: "Min Annual Fee",
                  values: compared.map((c) => c.minAnnualFee ? `₹${(c.minAnnualFee / 100000).toFixed(1)}L` : "N/A"),
                  bestId: bestFee,
                },
                {
                  label: "Avg Package",
                  values: compared.map((c) => c.placement ? `₹${c.placement.avgPackage} LPA` : "N/A"),
                  bestId: bestPkg,
                },
                {
                  label: "Highest Package",
                  values: compared.map((c) => c.placement ? `₹${c.placement.maxPackage} LPA` : "N/A"),
                  bestId: null,
                },
                {
                  label: "Placement %",
                  values: compared.map((c) => c.placement ? `${c.placement.placementPct}%` : "N/A"),
                  bestId: null,
                },
                {
                  label: "Streams",
                  values: compared.map((c) => c.streams.join(", ") || "N/A"),
                  bestId: null,
                },
                {
                  label: "Accreditation",
                  values: compared.map((c) => c.accreditation ?? "—"),
                  bestId: null,
                },
                {
                  label: "Student Rating",
                  values: compared.map((c) => c.avgRating ? `${c.avgRating}/5 (${c.reviewCount} reviews)` : "No reviews yet"),
                  bestId: null,
                },
              ].map((row, idx) => (
                <div
                  key={row.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `200px repeat(${compared.length}, 1fr)`,
                    borderBottom: idx < 9 ? "1px solid #F3F4F6" : "none",
                    background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                  }}
                >
                  <div style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#6B7280" }}>
                    {row.label}
                  </div>
                  {compared.map((c, ci) => {
                    const isBest = row.bestId === c.id;
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: "14px 20px",
                          fontSize: "14px",
                          fontWeight: isBest ? 700 : 400,
                          color: isBest ? "#16A34A" : "#111827",
                          borderLeft: "1px solid #F3F4F6",
                        }}
                      >
                        {isBest && (
                          <span style={{
                            display: "inline-block", fontSize: "10px", fontWeight: 700,
                            background: "#DCFCE7", color: "#16A34A",
                            borderRadius: "4px", padding: "1px 6px", marginRight: "6px",
                          }}>
                            ✓ BEST
                          </span>
                        )}
                        {row.values[ci]}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── TOP RECRUITERS SECTION ── */}
          {compared.length >= 2 && compared.some((c) => c.placement?.topRecruiters.length) && (
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
                Top Recruiters
              </p>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${compared.length}, 1fr)`, gap: "16px" }}>
                {compared.map((c) => (
                  <div key={c.id}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", marginBottom: "8px" }}>{c.name}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {c.placement?.topRecruiters.map((r) => (
                        <span key={r} style={{
                          padding: "3px 10px", borderRadius: "4px",
                          background: "#F3F4F6", fontSize: "12px", color: "#374151",
                        }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {compared.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "64px 24px", color: "#9CA3AF" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⚖️</div>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#374151" }}>
                Select 2 or 3 colleges and click Compare
              </p>
              <p style={{ fontSize: "14px", marginTop: "6px" }}>
                Use the weight sliders to personalise your score
              </p>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
        Loading…
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
```

## 7.6 Shortlist Page
**File:** `src/app/shortlist/page.tsx`

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import {
  getGuestShortlist,
  removeFromGuestShortlist,
  dispatchShortlistChange,
} from "@/lib/guestShortlist";

type ShortlistCollege = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  type: string;
  nirfRank: number | null;
  avgPackage: number | null;
  maxPackage: number | null;
  placementPct: number | null;
  minFee: number | null;
};

const TYPE_LABEL: Record<string, string> = {
  GOVT: "Government",
  PRIVATE: "Private",
  DEEMED: "Deemed",
};

export default function ShortlistPage() {
  const [colleges, setColleges] = useState<ShortlistCollege[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchShortlist = useCallback(async () => {
    setLoading(true);
    try {
      // Get IDs from localStorage
      const ids = getGuestShortlist().map((e) => e.collegeId);
      if (ids.length === 0) {
        setColleges([]);
        setLoading(false);
        return;
      }
      // Fetch full details from public colleges API
      const params = new URLSearchParams({ ids: ids.join(","), limit: "100" });
      const res = await fetch(`/api/colleges?${params.toString()}`);
      if (res.ok) {
        const data = await res.json() as { colleges?: ShortlistCollege[] };
        setColleges(data.colleges ?? []);
      } else {
        // Fallback: fetch each college individually
        const results: ShortlistCollege[] = [];
        for (const id of ids) {
          const r = await fetch(`/api/colleges/${id}`);
          if (r.ok) results.push(await r.json() as ShortlistCollege);
        }
        setColleges(results);
      }
    } catch {
      setToast({ message: "Could not load shortlist", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShortlist();
    // Re-fetch when shortlist changes
    window.addEventListener("guest-shortlist-change", fetchShortlist);
    return () => window.removeEventListener("guest-shortlist-change", fetchShortlist);
  }, [fetchShortlist]);

  function remove(collegeId: string) {
    removeFromGuestShortlist(collegeId);
    setColleges((prev) => prev.filter((c) => c.id !== collegeId));
    dispatchShortlistChange();
    setToast({ message: "Removed from shortlist", type: "success" });
  }

  // Loading
  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: "100vh", background: "#fff" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>My Shortlist</h1>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px", marginBottom: "28px" }}>Loading…</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: "100px", background: "#F3F4F6", borderRadius: "10px" }} />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>My Shortlist</h1>
          <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px", marginBottom: "28px" }}>
            {`${colleges.length} college${colleges.length !== 1 ? "s" : ""} saved`}
          </p>

          {colleges.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
              }}
            >
              <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>☆</p>
              <p style={{ fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                No colleges shortlisted yet
              </p>
              <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "20px" }}>
                Tap ☆ Shortlist on any college card or detail page.
              </p>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  background: "#FF385C",
                  color: "#fff",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Browse Colleges
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {colleges.length >= 2 && (
                <Link
                  href={`/compare?ids=${colleges.map((c) => c.slug).join(",")}`}
                  style={{
                    alignSelf: "flex-start",
                    marginBottom: "8px",
                    padding: "8px 16px",
                    background: "#FF385C",
                    color: "#fff",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Compare all shortlisted →
                </Link>
              )}
              {colleges.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    padding: "18px 20px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <Link
                        href={`/colleges/${c.slug}`}
                        style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}
                      >
                        {c.name}
                      </Link>
                      {c.nirfRank && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#FF385C",
                            background: "#FFF1F2",
                            padding: "2px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          NIRF #{c.nirfRank}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>
                      {c.city}, {c.state} · {TYPE_LABEL[c.type] ?? c.type}
                    </p>
                    <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px", color: "#6B7280" }}>
                      {c.avgPackage != null && <span>Avg ₹{c.avgPackage} LPA</span>}
                      {c.minFee != null && (
                        <span>From ₹{(c.minFee / 100000).toFixed(1)}L/yr</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link
                      href={`/colleges/${c.slug}`}
                      style={{
                        padding: "8px 14px",
                        background: "#FF385C",
                        color: "#fff",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      style={{
                        padding: "8px 14px",
                        border: "1px solid #FECACA",
                        color: "#DC2626",
                        borderRadius: "8px",
                        fontSize: "13px",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
```

## 7.7 Review Submission & Display Component
**File:** `src/app/colleges/[slug]/ReviewsSection.tsx`

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";

type Review = {
  id: string;
  authorName: string;
  batchYear: number;
  stream: string;
  ratingOverall: number;
  ratingPlacement: number;
  ratingFaculty: number;
  ratingInfra: number;
  body: string;
  createdAt: string;
};

type Aggregates = {
  overall: number;
  placement: number;
  faculty: number;
  infra: number;
  count: number;
};

type Props = {
  collegeSlug: string;
  initialReviews: Review[];
};

const RATING_FIELDS = [
  { key: "ratingOverall", label: "Overall" },
  { key: "ratingPlacement", label: "Placements" },
  { key: "ratingFaculty", label: "Faculty" },
  { key: "ratingInfra", label: "Infrastructure" },
] as const;

const defaultForm = {
  authorName: "",
  batchYear: new Date().getFullYear(),
  stream: "",
  body: "",
  ratingOverall: 5,
  ratingPlacement: 5,
  ratingFaculty: 5,
  ratingInfra: 5,
};

const CURRENT_YEAR = new Date().getFullYear();

export default function ReviewsSection({ collegeSlug, initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  const fetchReviews = useCallback(async (pageNum: number, append: boolean) => {
    const res = await fetch(
      `/api/colleges/${collegeSlug}/reviews?page=${pageNum}&limit=10`
    );
    if (!res.ok) return;
    const data = await res.json() as {
      data: Review[];
      totalPages: number;
      aggregates: Aggregates | null;
    };
    setAggregates(data.aggregates);
    setTotalPages(data.totalPages);
    setReviews((prev) => (append ? [...prev, ...data.data] : data.data));
  }, [collegeSlug]);

  useEffect(() => {
    fetchReviews(1, false);
  }, [fetchReviews]);

  function setField(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  }

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    await fetchReviews(next, true);
    setPage(next);
    setLoadingMore(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/colleges/${collegeSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as
        | { error: string; fields?: Record<string, string> }
        | Review;

      if (!res.ok) {
        if ("fields" in data && data.fields) {
          setErrors(data.fields);
        } else if ("error" in data) {
          setErrors({ _global: data.error });
        }
      } else {
        setSuccessMsg(
          "Review submitted! It will appear after moderation. Admins can approve at /admin/reviews."
        );
        setForm(defaultForm);
        setShowForm(false);
      }
    } catch {
      setErrors({ _global: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {aggregates && aggregates.count > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {[
            { label: "Overall", val: aggregates.overall },
            { label: "Placements", val: aggregates.placement },
            { label: "Faculty", val: aggregates.faculty },
            { label: "Infrastructure", val: aggregates.infra },
          ].map(({ label, val }) => (
            <div
              key={label}
              style={{
                textAlign: "center",
                padding: "12px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
            >
              <p style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {reviews.length === 0 ? (
        <p style={{ color: "#9CA3AF", fontSize: "14px", marginBottom: "20px" }}>
          No approved reviews yet. Be the first to write one!
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {page < totalPages && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          style={{
            marginBottom: "20px",
            padding: "8px 16px",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            fontSize: "13px",
            background: "#fff",
            cursor: loadingMore ? "not-allowed" : "pointer",
          }}
        >
          {loadingMore ? "Loading…" : "Load more reviews"}
        </button>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            padding: "9px 18px",
            border: "1.5px solid #FF385C",
            color: "#FF385C",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            background: "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Write a Review
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Write a Review</h3>

          {errors._global && (
            <p style={{ color: "#DC2626", fontSize: "13px" }}>{errors._global}</p>
          )}
          {successMsg && (
            <p style={{ color: "#16A34A", fontSize: "13px" }}>{successMsg}</p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Your Name" error={errors.authorName}>
              <input
                value={form.authorName}
                onChange={(e) => setField("authorName", e.target.value)}
                placeholder="e.g. Rahul Sharma"
                style={inputStyle}
              />
            </Field>
            <Field label="Batch Year" error={errors.batchYear}>
              <input
                type="number"
                min={2010}
                max={CURRENT_YEAR}
                value={form.batchYear}
                onChange={(e) => setField("batchYear", parseInt(e.target.value, 10))}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Stream / Branch" error={errors.stream}>
            <input
              value={form.stream}
              onChange={(e) => setField("stream", e.target.value)}
              placeholder="e.g. Computer Science"
              style={inputStyle}
            />
          </Field>

          <div>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#6B7280",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Ratings
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {RATING_FIELDS.map(({ key, label }) => (
                <Field key={key} label={label} error={errors[key]}>
                  <select
                    value={form[key as keyof typeof form] as number}
                    onChange={(e) => setField(key, parseFloat(e.target.value))}
                    style={inputStyle}
                  >
                    {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((v) => (
                      <option key={v} value={v}>
                        {v} ★
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          </div>

          <Field
            label={`Review (min 80 characters — ${form.body.length}/80)`}
            error={errors.body}
          >
            <textarea
              value={form.body}
              onChange={(e) => setField("body", e.target.value)}
              rows={4}
              placeholder="Share your honest experience about academics, placements, campus life..."
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "9px 20px",
                background: submitting ? "#FFBDCA" : "#FF385C",
                color: "#fff",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setErrors({});
              }}
              style={{
                padding: "9px 20px",
                border: "1.5px solid #DDDDDD",
                color: "#222222",
                borderRadius: "12px",
                fontSize: "14px",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const stars = (n: number) =>
    "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

  return (
    <div
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: "10px",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <div>
          <p style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>
            {review.authorName}
          </p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
            {review.stream} · Batch {review.batchYear}
          </p>
        </div>
        <span style={{ fontSize: "15px", color: "#F59E0B", letterSpacing: "1px" }}>
          {stars(review.ratingOverall)}
        </span>
      </div>

      <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.6, marginBottom: "12px" }}>
        {review.body}
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[
          { label: "Placement", val: review.ratingPlacement },
          { label: "Faculty", val: review.ratingFaculty },
          { label: "Infra", val: review.ratingInfra },
        ].map(({ label, val }) => (
          <span key={label} style={{ fontSize: "12px", color: "#6B7280" }}>
            {label}: <strong style={{ color: "#111827" }}>{val}</strong>/5
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: "12px", color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1.5px solid #DDDDDD",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#222222",
  background: "#fff",
  outline: "none",
  width: "100%",
};
```

## 7.8 Compare Tray Component
**File:** `src/components/CompareTray.tsx`

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ShortlistedCollege = { id: string; slug: string; name: string };

type Props = {
  shortlisted: ShortlistedCollege[];
};

export default function CompareTray({ shortlisted }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shortlisted.length >= 2 && !dismissed) {
      // small delay so it slides in after page settles
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [shortlisted.length, dismissed]);

  // Re-show tray if new college shortlisted after dismissal
  useEffect(() => {
    if (shortlisted.length >= 2) setDismissed(false);
  }, [shortlisted.length]);

  if (shortlisted.length < 2 || dismissed) return null;

  const compareUrl = `/compare?ids=${shortlisted.map((c) => c.slug).join(",")}`;

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "#222222",
          color: "#fff",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Left: colleges */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", color: "#AAAAAA", whiteSpace: "nowrap" }}>
            {shortlisted.length} selected:
          </span>
          {shortlisted.slice(0, 3).map((c) => (
            <span
              key={c.id}
              style={{
                padding: "5px 12px",
                background: "rgba(255,255,255,0.12)",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 500,
                whiteSpace: "nowrap",
                maxWidth: "180px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.name}
            </span>
          ))}
          {shortlisted.length > 3 && (
            <span style={{ fontSize: "13px", color: "#AAAAAA" }}>
              +{shortlisted.length - 3} more
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <Link
            href={compareUrl}
            style={{
              padding: "10px 22px",
              background: "#FF385C",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E31C5F")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FF385C")}
          >
            Compare Now →
          </Link>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss compare tray"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              fontSize: "18px",
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          >
            ×
          </button>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind tray */}
      {visible && <div style={{ height: "68px" }} />}
    </>
  );
}
```

## 7.9 Placements Section Component
**File:** `src/app/colleges/[slug]/PlacementsSection.tsx`

```tsx
"use client";

type PlacementStat = {
  id: string;
  year: number;
  avgPackage: number;
  maxPackage: number;
  placementPct: number;
  topRecruiters: string[];
};

export default function PlacementsSection({ stats }: { stats: PlacementStat[] }) {
  const maxPkg = Math.max(...stats.map((s) => s.maxPackage));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {stats.map((stat) => (
        <div key={stat.id}>
          {/* Year header */}
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#FF385C", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {stat.year}
          </p>

          {/* Package bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            <Bar
              label="Avg Package"
              value={stat.avgPackage}
              max={maxPkg}
              display={`₹${stat.avgPackage} LPA`}
              color="#FF385C"
            />
            <Bar
              label="Highest Package"
              value={stat.maxPackage}
              max={maxPkg}
              display={`₹${stat.maxPackage} LPA`}
              color="#16A34A"
            />
          </div>

          {/* Placement % */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>Students Placed</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{stat.placementPct}%</span>
            </div>
            <div style={{ height: "6px", background: "#F3F4F6", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${stat.placementPct}%`,
                background: "#FF385C", borderRadius: "99px",
              }} />
            </div>
          </div>

          {/* Top Recruiters */}
          {stat.topRecruiters.length > 0 && (
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                Top Recruiters
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {stat.topRecruiters.map((r) => (
                  <span key={r} style={{
                    padding: "4px 10px", borderRadius: "4px",
                    background: "#F9FAFB", border: "1px solid #E5E7EB",
                    fontSize: "12px", fontWeight: 500, color: "#374151",
                  }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  display,
  color,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{display}</span>
      </div>
      <div style={{ height: "8px", background: "#F3F4F6", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "99px" }} />
      </div>
    </div>
  );
}
```

## 7.10 Cutoffs Section Component
**File:** `src/app/colleges/[slug]/CutoffsSection.tsx`

```tsx
import { summarizeCutoffs, cutoffValueLabel, type CutoffRow, type CutoffSummary } from "@/lib/cutoffs";

type Props = { cutoffs: CutoffRow[] };

export default function CutoffsSection({ cutoffs }: Props) {
  const summaries = summarizeCutoffs(cutoffs);

  if (!summaries.length) return null;

  // Show latest year per exam (General first when present)
  const byExam = new Map<string, CutoffSummary>();
  for (const s of summaries) {
    const existing = byExam.get(s.exam);
    if (!existing || s.year > existing.year) {
      byExam.set(s.exam, s);
      continue;
    }
    if (
      s.year === existing.year &&
      s.category === "General" &&
      existing.category !== "General"
    ) {
      byExam.set(s.exam, s);
    }
  }

  const headline = [...byExam.values()].sort((a: CutoffSummary, b: CutoffSummary) => a.exam.localeCompare(b.exam));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>
        <strong>Last closing rank</strong> is the highest rank/score at which someone got a seat in{" "}
        <em>any</em> branch — if your rank is better (lower) than this number, you have a shot at
        entering the college.
      </p>

      {headline.map((s) => (
        <div
          key={`${s.exam}-${s.year}-${s.category}`}
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              background: "#F9FAFB",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              {s.exam} · {s.year} · {s.category}
            </p>
            <p style={{ fontSize: "15px", color: "#374151" }}>
              Last {cutoffValueLabel(s.exam).toLowerCase()} to get in (any branch):{" "}
              <strong style={{ fontSize: "1.35rem", color: "#FF385C" }}>
                {s.lastClosingRank.toLocaleString("en-IN")}
              </strong>
              <span style={{ fontSize: "13px", color: "#9CA3AF", marginLeft: "8px" }}>
                ({s.easiestBranch})
              </span>
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#fff" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 20px",
                    color: "#9CA3AF",
                    fontWeight: 600,
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Branch
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "10px 20px",
                    color: "#9CA3AF",
                    fontWeight: 600,
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  {cutoffValueLabel(s.exam)}
                </th>
              </tr>
            </thead>
            <tbody>
              {s.branches.map((b) => (
                <tr key={b.branch}>
                  <td style={{ padding: "10px 20px", color: "#374151", borderBottom: "1px solid #F3F4F6" }}>
                    {b.branch}
                  </td>
                  <td
                    style={{
                      padding: "10px 20px",
                      textAlign: "right",
                      fontWeight: 600,
                      color: "#111827",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    {b.cutoffValue.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Other categories / years — collapsed detail */}
      {summaries.length > headline.length && (
        <details style={{ fontSize: "13px", color: "#6B7280" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, color: "#FF385C" }}>
            All categories & years ({summaries.length} records)
          </summary>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {summaries.map((s) => (
              <div
                key={`all-${s.exam}-${s.year}-${s.category}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                }}
              >
                <span>
                  {s.exam} · {s.year} · {s.category}
                </span>
                <span style={{ fontWeight: 600 }}>
                  Last: {s.lastClosingRank.toLocaleString("en-IN")} ({s.easiestBranch})
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
```

## 7.11 Career Trends Section Component
**File:** `src/app/colleges/[slug]/CareerTrendsSection.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";

type CareerTrends = {
  placementYear: number;
  topRecruiters: {
    name: string;
    industry: string;
    salaryRange: { min: number; max: number };
    growth: "High Growth" | "Stable" | "Declining";
  }[];
  roleClusters: { title: string; count: number; avgSalary: number }[];
  growthDistribution: { highGrowth: number; stable: number; declining: number };
};

const GROWTH_STYLE: Record<string, { bg: string; color: string }> = {
  "High Growth": { bg: "#F0FDF4", color: "#16A34A" },
  Stable:        { bg: "#F9FAFB", color: "#6B7280" },
  Declining:     { bg: "#FEF2F2", color: "#DC2626" },
};

export default function CareerTrendsSection({ collegeSlug }: { collegeSlug: string }) {
  const [data, setData] = useState<CareerTrends | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/colleges/${collegeSlug}/careerTrends`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: CareerTrends) => setData(d))
      .catch(() => setError(true));
  }, [collegeSlug]);

  if (error || !data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <p style={{ fontSize: "13px", color: "#6B7280" }}>
        Based on {data.placementYear} placement recruiters — industry & salary intelligence.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {data.topRecruiters.slice(0, 8).map((r) => {
          const style = GROWTH_STYLE[r.growth] ?? GROWTH_STYLE.Stable;
          return (
            <div
              key={r.name}
              style={{
                padding: "12px 14px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                minWidth: "140px",
                flex: "1 1 160px",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>{r.name}</p>
              <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{r.industry}</p>
              <p style={{ fontSize: "12px", color: "#374151", marginTop: "6px" }}>
                ₹{(r.salaryRange.min / 100000).toFixed(0)}–{(r.salaryRange.max / 100000).toFixed(0)} LPA
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: "6px",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: style.bg,
                  color: style.color,
                }}
              >
                {r.growth}
              </span>
            </div>
          );
        })}
      </div>

      <div>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "8px" }}>
          Role clusters
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {data.roleClusters.slice(0, 5).map((role) => (
            <div
              key={role.title}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            >
              <span>{role.title}</span>
              <span style={{ color: "#6B7280" }}>
                {role.count} offers · ₹{(role.avgSalary / 100000).toFixed(1)}L avg
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

# 8. Config

## 8.1 package.json
**File:** `package.json`

```json
{
  "name": "CollegeScout",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "seed": "prisma db seed"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "@types/bcryptjs": "^2.4.6",
    "axios": "^1.16.1",
    "bcryptjs": "^3.0.3",
    "next": "16.2.6",
    "next-auth": "^5.0.0-beta.31",
    "prisma": "^5.22.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.6",
    "tailwindcss": "^4",
    "ts-node": "^10.9.2",
    "tsx": "^4.22.3",
    "typescript": "^5"
  }
}
```

## 8.2 next.config.ts
**File:** `next.config.ts`

```typescript
import type { NextConfig } from "next";
import path from "path";

// Parent folder has another package-lock.json; pin root so .env loads from this project
const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
```

## 8.3 tsconfig.json
**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

## 8.4 .env.example (Sanitized)
**File:** `.env.example`

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/collegescout?schema=public"

# Authentication (NextAuth.js v5)
AUTH_SECRET="generate-a-secure-secret-here"
NEXTAUTH_SECRET="generate-a-secure-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Admin API Key (used for review moderation)
ADMIN_API_KEY="admin-secret-key-change-me"
```

