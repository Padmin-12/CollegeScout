import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

/** Legacy route — redirect to canonical /colleges/[slug] */
export default async function LegacyCollegePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const college = await prisma.college.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { slug: true },
  });

  if (!college) notFound();
  redirect(`/colleges/${college.slug}`);
}
