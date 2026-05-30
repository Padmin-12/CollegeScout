import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ShortlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fshortlist");
  }

  return children;
}
