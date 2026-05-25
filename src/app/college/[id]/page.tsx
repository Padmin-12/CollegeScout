import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // This old route at /college/[id] redirects to the new /colleges/[slug]
  // Find by id and redirect, or show data directly
  const college = await prisma.college.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      courseFees:      { orderBy: { annualFee: "asc" } },
      placementStats:  { orderBy: { year: "desc" } },
      admissionCutoffs: { orderBy: [{ year: "desc" }] },
      reviews: {
        where:   { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!college) notFound();

  const latestPlacement = college.placementStats[0];
  const minFee = college.courseFees[0]?.annualFee ?? null;

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#fff", padding: "0 0 80px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>

          {/* Breadcrumb */}
          <nav style={{ fontSize: "13px", color: "#6B7280", marginBottom: "24px" }}>
            <Link href="/" style={{ color: "#006AFF" }}>Colleges</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span>{college.name}</span>
          </nav>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            {college.nirfRank && (
              <span className="nirf-badge" style={{ marginBottom: "12px", display: "inline-block" }}>
                NIRF #{college.nirfRank}
              </span>
            )}
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
              {college.name}
            </h1>
            <p style={{ color: "#6B7280", marginTop: "6px", fontSize: "15px" }}>
              {college.city}, {college.state} &nbsp;·&nbsp; Est. {college.established}
              {college.accreditation && ` · ${college.accreditation}`}
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <Link href={`/colleges/${college.slug}`} style={{
                padding: "8px 16px", background: "#006AFF", color: "#fff",
                borderRadius: "8px", fontSize: "14px", fontWeight: 600,
              }}>
                Full Detail Page →
              </Link>
              <Link href="/" style={{
                padding: "8px 16px", border: "1.5px solid #E5E7EB", color: "#374151",
                borderRadius: "8px", fontSize: "14px",
              }}>
                ← Back
              </Link>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
            <StatCard label="Min Annual Fee" value={minFee ? `₹${(minFee / 100000).toFixed(1)}L` : "N/A"} />
            <StatCard label="Avg Package" value={latestPlacement ? `₹${latestPlacement.avgPackage} LPA` : "N/A"} />
            <StatCard label="Placement %" value={latestPlacement ? `${latestPlacement.placementPct}%` : "N/A"} />
          </div>

          {/* Courses */}
          <Section title="Courses & Fees">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {college.courseFees.map((cf) => (
                <div key={cf.id} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "12px 16px", border: "1px solid #E5E7EB", borderRadius: "8px",
                }}>
                  <span style={{ fontWeight: 500 }}>{cf.course} — {cf.degree}</span>
                  <span style={{ color: "#006AFF", fontWeight: 600 }}>₹{cf.annualFee.toLocaleString("en-IN")}/yr</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Placements */}
          {college.placementStats.length > 0 && (
            <Section title="Placement Stats">
              {college.placementStats.map((p) => (
                <div key={p.id} style={{ marginBottom: "16px" }}>
                  <p style={{ fontWeight: 600, marginBottom: "8px" }}>{p.year}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                    <StatCard label="Avg Package" value={`₹${p.avgPackage} LPA`} />
                    <StatCard label="Max Package" value={`₹${p.maxPackage} LPA`} />
                    <StatCard label="Placed" value={`${p.placementPct}%`} />
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Admission Cutoffs */}
          {college.admissionCutoffs.length > 0 && (
            <Section title="Admission Cutoffs">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {college.admissionCutoffs.map((cut) => (
                  <div key={cut.id} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "10px 16px", border: "1px solid #E5E7EB", borderRadius: "8px",
                    fontSize: "14px",
                  }}>
                    <span>{cut.exam} · {cut.year} · {cut.category}</span>
                    <span style={{ fontWeight: 600 }}>{cut.cutoffValue.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

        </div>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px",
      textAlign: "center",
    }}>
      <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", marginBottom: "4px" }}>
        {label}
      </p>
      <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827" }}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #E5E7EB" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}