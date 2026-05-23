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