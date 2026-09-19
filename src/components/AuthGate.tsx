"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type Feature = "Compare" | "Predictor" | "Shortlist";

const FEATURE_INFO: Record<Feature, { icon: string; title: string; desc: string; bullets: string[] }> = {
  Compare: {
    icon: "⚖️",
    title: "Compare Colleges Side-by-Side",
    desc: "See which college wins across placement, fees, ranking and more — with live weighted scoring.",
    bullets: [
      "Visual winner highlights per metric",
      "Adjust weights: Placement vs Fees vs Ranking",
      "Best Match badge that updates live",
      "Highlight only the rows that differ",
    ],
  },
  Predictor: {
    icon: "🎯",
    title: "Personalised Admission Predictor",
    desc: "Enter your entrance exam rank or score to see your realistic admission chances at every college.",
    bullets: [
      "Based on available historical cutoff data",
      "High / Medium / Low Likelihood bands",
      "Covers JEE, BITSAT, VITEEE, MHT-CET and more",
      "Grouped by likelihood — not just a list",
    ],
  },
  Shortlist: {
    icon: "★",
    title: "Your Personal Shortlist",
    desc: "All the colleges you've saved, synced to your account so they never disappear.",
    bullets: [
      "Access your shortlist from any device",
      "Compare all shortlisted colleges in one click",
      "Track fees, packages and ranks at a glance",
      "Remove colleges as your search narrows",
    ],
  },
};

function Skeleton() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "50%",
        border: "3px solid #DDDDDD", borderTopColor: "#FF385C",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AuthGate({ feature, children }: { feature: Feature; children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const info = FEATURE_INFO[feature];

  const queryString = searchParams?.toString();
  const fullCallbackUrl = queryString ? `${pathname}?${queryString}` : pathname;
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(fullCallbackUrl)}&feature=${feature}`;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(loginUrl);
    }
  }, [status, loginUrl, router]);

  if (status === "loading" || status === "unauthenticated") return <Skeleton />;

  if (status === "authenticated") return <>{children}</>;

  // Auth wall fallback
  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      background: "#fff",
    }}>
      <div style={{
        maxWidth: "460px",
        width: "100%",
        textAlign: "center",
      }}>
        {/* Icon */}
        <div style={{ fontSize: "52px", marginBottom: "20px", lineHeight: 1 }}>{info.icon}</div>

        {/* Heading */}
        <h1 style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          color: "#222222",
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
          marginBottom: "12px",
        }}>
          {info.title}
        </h1>

        <p style={{ fontSize: "15px", color: "#717171", lineHeight: 1.6, marginBottom: "28px" }}>
          {info.desc}
        </p>

        {/* Bullets */}
        <div style={{
          background: "#F7F7F7",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "28px",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          {info.bullets.map((b) => (
            <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "#222222" }}>
              <span style={{ color: "#FF385C", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>✓</span>
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href={loginUrl}
          style={{
            display: "block",
            width: "100%",
            padding: "14px",
            background: "#FF385C",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.2s ease",
            marginBottom: "12px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E31C5F")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FF385C")}
        >
          Sign in to continue
        </Link>

        <Link
          href={`/login?tab=register&callbackUrl=${encodeURIComponent(fullCallbackUrl)}&feature=${feature}`}
          style={{ fontSize: "13px", color: "#717171", textDecoration: "underline" }}
        >
          New here? Create a free account
        </Link>

        {/* Back link */}
        <div style={{ marginTop: "24px" }}>
          <Link href="/" style={{ fontSize: "13px", color: "#AAAAAA" }}>
            ← Back to college search
          </Link>
        </div>
      </div>
    </div>
  );
}
