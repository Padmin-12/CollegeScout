import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import PlacementsSection from "./PlacementsSection";
import ReviewsSection from "./ReviewsSection";
import CutoffsSection from "./CutoffsSection";
import CareerTrendsSection from "./CareerTrendsSection";
import ShortlistButton from "@/components/ShortlistButton";

// ── Types ──────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const college = await prisma.college.findUnique({ where: { slug } });
  if (!college) return { title: "College Not Found" };
  return {
    title: `${college.name} — Fees, Placements & Reviews | CollegeScout`,
    description: `Explore ${college.name} in ${college.city}: courses, fees, placement packages, cutoffs, and student reviews.`,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function CollegeDetailPage({ params }: Props) {
  const { slug } = await params;

  const college = await prisma.college.findUnique({
    where: { slug },
    include: {
      courseFees:       { orderBy: { annualFee: "asc" } },
      placementStats:   { orderBy: { year: "desc" } },
      admissionCutoffs: { orderBy: [{ year: "desc" }, { exam: "asc" }, { category: "asc" }] },
      reviews: {
        where:   { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take:    10,
      },
    },
  });

  if (!college) notFound();

  const latestPlacement = college.placementStats[0] ?? null;
  const minFee          = college.courseFees[0]?.annualFee ?? null;

  const reviewCount = await prisma.review.count({
    where: { collegeId: college.id, status: "APPROVED" },
  });

  const TYPE_LABEL: Record<string, string> = {
    GOVT: "Government", PRIVATE: "Private", DEEMED: "Deemed",
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px 80px" }}>

          {/* Breadcrumb */}
          <nav style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "20px" }}>
            <Link href="/" style={{ color: "#006AFF" }}>Colleges</Link>
            <span style={{ margin: "0 6px" }}>›</span>
            <span>{college.name}</span>
          </nav>

          {/* ── HEADER ── */}
          <div style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              {college.nirfRank && (
                <span style={styles.badge("#EFF6FF", "#006AFF", "#BFDBFE")}>
                  NIRF #{college.nirfRank}
                </span>
              )}
              <span style={styles.badge("#F9FAFB", "#374151", "#E5E7EB")}>
                {TYPE_LABEL[college.type] ?? college.type}
              </span>
              {college.accreditation && (
                <span style={styles.badge("#F0FDF4", "#15803D", "#BBF7D0")}>
                  {college.accreditation}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#111827", lineHeight: 1.2, marginBottom: "8px" }}>
              {college.name}
            </h1>
            <p style={{ fontSize: "15px", color: "#6B7280" }}>
              {college.city}, {college.state} &nbsp;·&nbsp; Est. {college.established}
              {college.website && (
                <>
                  &nbsp;·&nbsp;
                  <a href={college.website} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#006AFF" }}>
                    Website ↗
                  </a>
                </>
              )}
            </p>

            {/* Streams */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
              {college.streams.map((s) => (
                <span key={s} style={styles.badge("#F0FDF4", "#16A34A", "#BBF7D0")}>{s}</span>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap", alignItems: "center" }}>
              <Link href={`/compare?ids=${college.slug}`} style={styles.btnPrimary}>
                ⚖️ Compare
              </Link>
              <ShortlistButton collegeId={college.id} />
              <Link href="/" style={styles.btnSecondary}>← Back to Search</Link>
            </div>
          </div>

          {/* ── QUICK STATS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "40px" }}>
            <QuickStat label="Min Annual Fee" value={minFee ? `₹${(minFee / 100000).toFixed(1)}L` : "N/A"} />
            <QuickStat
              label="Avg Package"
              value={latestPlacement ? `₹${latestPlacement.avgPackage} LPA` : "N/A"}
              sub={latestPlacement ? `${latestPlacement.year}` : undefined}
            />
            <QuickStat
              label="Highest Package"
              value={latestPlacement ? `₹${latestPlacement.maxPackage} LPA` : "N/A"}
            />
            <QuickStat
              label="Placement %"
              value={latestPlacement ? `${latestPlacement.placementPct}%` : "N/A"}
            />
          </div>

          {/* ── COURSES & FEES ── */}
          <Section title="Courses & Fees">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {college.courseFees.map((cf) => (
                <div key={cf.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", border: "1px solid #E5E7EB", borderRadius: "8px",
                  fontSize: "14px",
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "#111827" }}>{cf.course}</span>
                    <span style={{ color: "#9CA3AF", marginLeft: "8px" }}>{cf.degree}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: "#006AFF", whiteSpace: "nowrap" }}>
                    ₹{cf.annualFee.toLocaleString("en-IN")}<span style={{ fontWeight: 400, color: "#9CA3AF", fontSize: "12px" }}>/yr</span>
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── PLACEMENTS ── */}
          {college.placementStats.length > 0 && (
            <Section title="Placements">
              <PlacementsSection stats={college.placementStats} />
            </Section>
          )}

          {college.placementStats.length > 0 && (
            <Section title="Career Trends">
              <CareerTrendsSection collegeSlug={college.slug} />
            </Section>
          )}

          {/* ── ADMISSION CUTOFFS ── */}
          {college.admissionCutoffs.length > 0 && (
            <Section title="Admission Cutoffs">
              <CutoffsSection cutoffs={college.admissionCutoffs} />
            </Section>
          )}

          {/* ── REVIEWS ── */}
          <Section title={`Student Reviews${reviewCount > 0 ? ` (${reviewCount})` : ""}`}>
            <ReviewsSection
              collegeSlug={college.slug}
              initialReviews={college.reviews.map((r) => ({
                ...r,
                createdAt: r.createdAt.toISOString(),
              }))}
            />
          </Section>

        </div>
      </main>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function QuickStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      border: "1px solid #E5E7EB", borderRadius: "10px", padding: "16px",
      textAlign: "center",
    }}>
      <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", marginBottom: "6px" }}>
        {label}
      </p>
      <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>{value}</p>
      {sub && <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <h2 style={{
        fontSize: "1.1rem", fontWeight: 700, color: "#111827",
        paddingBottom: "12px", borderBottom: "1px solid #E5E7EB", marginBottom: "20px",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

const styles = {
  badge: (bg: string, color: string, border: string): React.CSSProperties => ({
    display: "inline-block", padding: "3px 9px", borderRadius: "4px",
    fontSize: "11px", fontWeight: 600, background: bg, color, border: `1px solid ${border}`,
  }),
  btnPrimary: {
    padding: "9px 18px", background: "#006AFF", color: "#fff",
    borderRadius: "8px", fontSize: "14px", fontWeight: 600,
  } as React.CSSProperties,
  btnSecondary: {
    padding: "9px 18px", border: "1.5px solid #E5E7EB", color: "#374151",
    borderRadius: "8px", fontSize: "14px", background: "#fff",
  } as React.CSSProperties,
};
