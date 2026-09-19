import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

export async function POST() {
  try {
    const demoEmail = process.env.DEMO_USER_EMAIL || "demo@collegescout.in";
    const demoPassword = process.env.DEMO_USER_PASSWORD || "DemoInterview2026!";

    // Ensure the demo user exists in database
    const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!existing) {
      const passwordHash = await hash(demoPassword, 12);
      await prisma.user.create({
        data: {
          email: demoEmail,
          name: "Demo User",
          passwordHash,
        },
      });
    }

    return NextResponse.json({ email: demoEmail, password: demoPassword });
  } catch (error) {
    console.error("[POST /api/auth/demo]", error);
    return NextResponse.json(
      { error: "Failed to initialize demo credentials" },
      { status: 500 }
    );
  }
}
