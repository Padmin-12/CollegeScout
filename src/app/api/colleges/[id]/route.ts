import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const college = await prisma.college.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!college) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(college);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch college" },
      { status: 500 }
    );
  }
}