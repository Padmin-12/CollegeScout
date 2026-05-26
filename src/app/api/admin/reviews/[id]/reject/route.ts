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
