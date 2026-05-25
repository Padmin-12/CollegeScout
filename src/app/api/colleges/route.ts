import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

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