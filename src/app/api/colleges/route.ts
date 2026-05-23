import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";
    const exam = searchParams.get("exam") || "";
    const minFees = searchParams.get("minFees");
    const maxFees = searchParams.get("maxFees");
    const minRating = searchParams.get("minRating");

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "9", 10))
    );
    const skip = (page - 1) * limit;

    const where: Prisma.CollegeWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
                { courses: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        location
          ? { location: { contains: location, mode: "insensitive" } }
          : {},
        exam
          ? { examCutoff: { contains: exam, mode: "insensitive" } }
          : {},
        minFees ? { fees: { gte: parseInt(minFees, 10) } } : {},
        maxFees ? { fees: { lte: parseInt(maxFees, 10) } } : {},
        minRating ? { rating: { gte: parseFloat(minRating) } } : {},
      ],
    };

    const [colleges, total] = await Promise.all([
      prisma.college.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: "desc" },
        select: {
          id: true,
          name: true,
          location: true,
          fees: true,
          rating: true,
          placements: true,
          examCutoff: true,
          image: true,
          highestPackage: true,
        },
      }),
      prisma.college.count({ where }),
    ]);

    return NextResponse.json({
      data: colleges,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch colleges" },
      { status: 500 }
    );
  }
}