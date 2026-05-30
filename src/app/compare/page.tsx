"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────

type CollegeOption = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
};

type PlacementStat = {
  year: number;
  avgPackage: number;
  maxPackage: number;
  placementPct: number;
  topRecruiters: string[];
};

type CourseFee = {
  course: string;
  degree: string;
  annualFee: number;
};

type Cutoff = {
  exam: string;
  year: number;
  category: string;
  cutoffValue: number;
};

type ComparedCollege = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  type: string;
  streams: string[];
  nirfRank: number | null;
  established: number;
  accreditation: string | null;
  minAnnualFee: number | null;
  allFees: CourseFee[];
  placement: PlacementStat | null;
  cutoffs: Cutoff[];
  avgRating: number | null;
  reviewCount: number;
};

// ── Slider Component ────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color }}>
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
        style={{ accentColor: color, width: "100%", cursor: "pointer" }}
      />
    </div>
  );
}

// ── Main Content ────────────────────────────────────────────────────────────

function CompareContent() {
  const searchParams = useSearchParams();
  const preloadSlug  = searchParams.get("ids")?.split(",")[0] ?? "";

  const [allColleges, setAllColleges] = useState<CollegeOption[]>([]);
  const [slug1,       setSlug1]       = useState(preloadSlug);
  const [slug2,       setSlug2]       = useState("");
  const [slug3,       setSlug3]       = useState("");
  const [compared,    setCompared]    = useState<ComparedCollege[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(true);
  const [error,       setError]       = useState("");

  // Weight sliders
  const [wPlacement, setWPlacement] = useState(0.6);
  const [wFees,      setWFees]      = useState(0.3);
  const [wLocation,  setWLocation]  = useState(0.1);

  // Normalise weights so they always sum to 1
  const total      = wPlacement + wFees + wLocation || 1;
  const weights    = { placement: wPlacement / total, fees: wFees / total, location: wLocation / total };

  // Scores (0–100)
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/colleges?limit=50")
      .then((r) => r.json())
      .then((d) => { setAllColleges(d.data ?? []); setFetching(false); })
      .catch(() => setFetching(false));
  }, []);

  async function handleCompare() {
    const slugs = [slug1, slug2, slug3].filter(Boolean);
    if (slugs.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/colleges/compare?ids=${slugs.join(",")}`);
      const data = await res.json() as { colleges?: ComparedCollege[]; error?: string };
      if (!res.ok || !data.colleges) {
        setError(data.error ?? "Failed to fetch comparison");
        setCompared([]);
      } else {
        setCompared(data.colleges);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Re-score whenever weights or colleges change
  useEffect(() => {
    if (compared.length === 0) return;

    const pkgs   = compared.map((c) => c.placement?.avgPackage ?? 0);
    const fees   = compared.map((c) => c.minAnnualFee ?? 0);
    const ranks  = compared.map((c) => c.nirfRank ?? 999);

    const minPkg = Math.min(...pkgs), maxPkg = Math.max(...pkgs);
    const minFee = Math.min(...fees), maxFee = Math.max(...fees);
    const minRnk = Math.min(...ranks), maxRnk = Math.max(...ranks);

    const norm = (v: number, lo: number, hi: number) =>
      hi === lo ? 0.5 : (v - lo) / (hi - lo);

    const tier1Cities = ["mumbai", "bangalore", "delhi", "hyderabad", "pune"];
const newScores: Record<string, number> = {};
for (const c of compared) {
  const p = norm(c.placement?.avgPackage ?? 0, minPkg, maxPkg);
  const f = 1 - norm(c.minAnnualFee ?? 0, minFee, maxFee);
  const l = tier1Cities.some((city) => c.city.toLowerCase().includes(city)) ? 1 : 0.5;
  newScores[c.id] = Math.round((weights.placement * p + weights.fees * f + weights.location * l) * 1000) / 10;
}
    setScores(newScores);
  }, [compared, weights.placement, weights.fees, weights.location]);

  const ranked = [...compared].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const best   = (key: "avgPackage" | "minAnnualFee" | "nirfRank", mode: "higher" | "lower") => {
    if (compared.length < 2) return null;
    const vals = compared.map((c) => ({
      id: c.id,
      v:  key === "avgPackage" ? (c.placement?.avgPackage ?? null)
        : key === "minAnnualFee" ? c.minAnnualFee
        : c.nirfRank,
    })).filter((x) => x.v != null);
    if (vals.length < 2) return null;
    return mode === "higher"
      ? vals.reduce((a, b) => ((a.v ?? 0) > (b.v ?? 0) ? a : b)).id
      : vals.reduce((a, b) => ((a.v ?? 999999) < (b.v ?? 999999) ? a : b)).id;
  };

  const bestPkg  = best("avgPackage",   "higher");
  const bestFee  = best("minAnnualFee", "lower");
  const bestNirf = best("nirfRank",     "lower");

  const scoreColors = ["#FF385C", "#16A34A", "#D97706"];

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
              Compare Colleges
            </h1>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px" }}>
              Select up to 3 colleges and adjust weights to see your personalised ranking
            </p>
          </div>

          {/* ── COLLEGE SELECTORS ── */}
          <div style={{
            border: "1px solid #E5E7EB", borderRadius: "12px",
            padding: "20px 24px", marginBottom: "24px", background: "#fff",
          }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
              {[
                { val: slug1, set: setSlug1, label: "College 1" },
                { val: slug2, set: setSlug2, label: "College 2" },
                { val: slug3, set: setSlug3, label: "College 3 (optional)" },
              ].map(({ val, set, label }) => (
                <div key={label} style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>{label}</label>
                  <select
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    disabled={fetching}
                    style={{
                      padding: "9px 12px", border: "1.5px solid #E5E7EB",
                      borderRadius: "8px", fontSize: "14px", color: "#111827",
                      background: "#fff", outline: "none", cursor: "pointer",
                    }}
                  >
                    <option value="">{fetching ? "Loading…" : `-- ${label} --`}</option>
                    {allColleges
                      .filter((c) => !([slug1, slug2, slug3].filter((s) => s !== val).includes(c.slug)))
                      .map((c) => (
                        <option key={c.id} value={c.slug}>{c.name}</option>
                      ))}
                  </select>
                </div>
              ))}

              <button
                onClick={handleCompare}
                disabled={!slug1 || !slug2 || loading}
                style={{
                  padding: "9px 22px", borderRadius: "8px", fontSize: "14px",
                  fontWeight: 600, border: "none", cursor: (!slug1 || !slug2) ? "not-allowed" : "pointer",
                  background: (!slug1 || !slug2) ? "#FFBDCA" : "#FF385C",
                  color: "#fff", flexShrink: 0,
                }}
              >
                {loading ? "Loading…" : "Compare →"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626",
              borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {/* ── WEIGHT SLIDERS ── */}
          {compared.length >= 2 && (
            <div style={{
              border: "1px solid #E5E7EB", borderRadius: "12px",
              padding: "20px 24px", marginBottom: "24px",
            }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
                Adjust Your Priorities
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                <Slider label="Placement Package" value={wPlacement} onChange={setWPlacement} color="#FF385C" />
                <Slider label="Affordability (fees)" value={wFees} onChange={setWFees} color="#16A34A" />
                <Slider label="Location Preference" value={wLocation} onChange={setWLocation} color="#D97706" />              </div>
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "12px" }}>
              Weights auto-normalise to 100% · {Math.round(weights.placement * 100)}% placement + {Math.round(weights.fees * 100)}% fees + {Math.round(weights.location * 100)}% location              </p>
            </div>
          )}

          {/* ── SCORE CARDS ── */}
          {ranked.length >= 2 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${ranked.length}, 1fr)`, gap: "12px", marginBottom: "28px" }}>
              {ranked.map((c, i) => (
                <div key={c.id} style={{
                  border: `2px solid ${i === 0 ? scoreColors[0] : "#DDDDDD"}`,
                  borderRadius: "12px", padding: "20px",
                  background: i === 0 ? "#FFF1F2" : "#fff",
                }}>
                  {i === 0 && (
                    <div style={{
                      display: "inline-block", fontSize: "11px", fontWeight: 700,
                      background: "#FF385C", color: "#fff", borderRadius: "6px",
                      padding: "2px 8px", marginBottom: "8px",
                    }}>
                      #1 Best Match
                    </div>
                  )}
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
                    {c.name}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>
                    {c.city}, {c.state}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 800, color: scoreColors[i] ?? "#374151" }}>
                      {(scores[c.id] ?? 0).toFixed(1)}
                    </span>
                    <span style={{ fontSize: "13px", color: "#9CA3AF" }}>/ 100</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>Weighted score</p>
                </div>
              ))}
            </div>
          )}

          {/* ── COMPARISON TABLE ── */}
          {compared.length >= 2 && (
            <div style={{
              border: "1px solid #E5E7EB", borderRadius: "12px",
              overflow: "hidden", marginBottom: "24px",
            }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: `200px repeat(${compared.length}, 1fr)`,
                background: "#F9FAFB",
                borderBottom: "1px solid #E5E7EB",
                padding: "14px 20px",
              }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Metric
                </span>
                {compared.map((c) => (
                  <span key={c.id} style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                    {c.name}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {[
                {
                  label: "NIRF Rank",
                  values: compared.map((c) => c.nirfRank ? `#${c.nirfRank}` : "N/A"),
                  bestId: bestNirf,
                },
                {
                  label: "Type",
                  values: compared.map((c) => c.type === "GOVT" ? "Government" : c.type === "PRIVATE" ? "Private" : "Deemed"),
                  bestId: null,
                },
                {
                  label: "Established",
                  values: compared.map((c) => String(c.established)),
                  bestId: null,
                },
                {
                  label: "Min Annual Fee",
                  values: compared.map((c) => c.minAnnualFee ? `₹${(c.minAnnualFee / 100000).toFixed(1)}L` : "N/A"),
                  bestId: bestFee,
                },
                {
                  label: "Avg Package",
                  values: compared.map((c) => c.placement ? `₹${c.placement.avgPackage} LPA` : "N/A"),
                  bestId: bestPkg,
                },
                {
                  label: "Highest Package",
                  values: compared.map((c) => c.placement ? `₹${c.placement.maxPackage} LPA` : "N/A"),
                  bestId: null,
                },
                {
                  label: "Placement %",
                  values: compared.map((c) => c.placement ? `${c.placement.placementPct}%` : "N/A"),
                  bestId: null,
                },
                {
                  label: "Streams",
                  values: compared.map((c) => c.streams.join(", ") || "N/A"),
                  bestId: null,
                },
                {
                  label: "Accreditation",
                  values: compared.map((c) => c.accreditation ?? "—"),
                  bestId: null,
                },
                {
                  label: "Student Rating",
                  values: compared.map((c) => c.avgRating ? `${c.avgRating}/5 (${c.reviewCount} reviews)` : "No reviews yet"),
                  bestId: null,
                },
              ].map((row, idx) => (
                <div
                  key={row.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `200px repeat(${compared.length}, 1fr)`,
                    borderBottom: idx < 9 ? "1px solid #F3F4F6" : "none",
                    background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                  }}
                >
                  <div style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#6B7280" }}>
                    {row.label}
                  </div>
                  {compared.map((c, ci) => {
                    const isBest = row.bestId === c.id;
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: "14px 20px",
                          fontSize: "14px",
                          fontWeight: isBest ? 700 : 400,
                          color: isBest ? "#16A34A" : "#111827",
                          borderLeft: "1px solid #F3F4F6",
                        }}
                      >
                        {isBest && (
                          <span style={{
                            display: "inline-block", fontSize: "10px", fontWeight: 700,
                            background: "#DCFCE7", color: "#16A34A",
                            borderRadius: "4px", padding: "1px 6px", marginRight: "6px",
                          }}>
                            ✓ BEST
                          </span>
                        )}
                        {row.values[ci]}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── TOP RECRUITERS SECTION ── */}
          {compared.length >= 2 && compared.some((c) => c.placement?.topRecruiters.length) && (
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
                Top Recruiters
              </p>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${compared.length}, 1fr)`, gap: "16px" }}>
                {compared.map((c) => (
                  <div key={c.id}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", marginBottom: "8px" }}>{c.name}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {c.placement?.topRecruiters.map((r) => (
                        <span key={r} style={{
                          padding: "3px 10px", borderRadius: "4px",
                          background: "#F3F4F6", fontSize: "12px", color: "#374151",
                        }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {compared.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "64px 24px", color: "#9CA3AF" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⚖️</div>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#374151" }}>
                Select 2 or 3 colleges and click Compare
              </p>
              <p style={{ fontSize: "14px", marginTop: "6px" }}>
                Use the weight sliders to personalise your score
              </p>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
        Loading…
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}