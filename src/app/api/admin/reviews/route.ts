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
