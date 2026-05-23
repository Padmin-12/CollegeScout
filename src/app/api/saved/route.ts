import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// GET /api/saved — list saved colleges for the current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const saved = await prisma.savedCollege.findMany({
      where: { userId: session.user.id },
      include: { college: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(saved.map((s) => s.college));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch saved colleges" },
      { status: 500 }
    );
  }
}

// POST /api/saved — save a college
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collegeId } = await req.json();

    if (!collegeId) {
      return NextResponse.json(
        { error: "collegeId is required" },
        { status: 400 }
      );
    }

    const saved = await prisma.savedCollege.upsert({
      where: {
        userId_collegeId: {
          userId: session.user.id,
          collegeId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        collegeId,
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save college" },
      { status: 500 }
    );
  }
}

// DELETE /api/saved — unsave a college
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collegeId } = await req.json();

    if (!collegeId) {
      return NextResponse.json(
        { error: "collegeId is required" },
        { status: 400 }
      );
    }

    await prisma.savedCollege.deleteMany({
      where: {
        userId: session.user.id,
        collegeId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to unsave college" },
      { status: 500 }
    );
  }
}
