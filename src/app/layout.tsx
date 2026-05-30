import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CollegeHunt — Discover Your Ideal College in India",
  description:
    "Search, compare, and shortlist top Indian colleges. Smart admission predictor, placement data, and personalised scoring. Discover → Shortlist → Compare → Decide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body style={{ minHeight: "100vh", background: "#fff", margin: 0 }}>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
