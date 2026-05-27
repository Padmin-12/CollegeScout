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