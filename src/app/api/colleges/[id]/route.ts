import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;

    const college = await prisma.college.findFirst({
      where: {
        id: id,
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