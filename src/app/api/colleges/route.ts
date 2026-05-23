import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";

    const colleges = await prisma.college.findMany({
      where: {
        AND: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            location: {
              contains: location,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    return NextResponse.json(colleges);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch colleges" },
      { status: 500 }
    );
  }
}