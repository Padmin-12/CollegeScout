"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";

// ── Types ──────────────────────────────────────────────────────────────────

type PredictorResult = {
  collegeId:         string;
  slug:              string;
  name:              string;
  city:              string;
  nirfRank:          number | null;
  lastClosingRank:   number;
  cutoffYear:        number;
  probability:       "high" | "medium" | "low";
  avgPackage:        number | null;
  minFee:            number | null;
};

type PredictorResponse = {
  exam:       string;
  percentile: number;
  category:   string;
  results:    PredictorResult[];
};

// ── Config ─────────────────────────────────────────────────────────────────

const EXAMS = [
  { label: "JEE Advanced",  value: "JEE Advanced",  type: "rank",  placeholder: "e.g. 1500 (rank)" },
  { label: "JEE Main",      value: "JEE Main",      type: "rank",  placeholder: "e.g. 5000 (rank)" },
  { label: "MHT-CET",       value: "MHT-CET",       type: "pct",   placeholder: "e.g. 98.5 (percentile)" },
  { label: "BITSAT",        value: "BITSAT",         type: "score", placeholder: "e.g. 320 (score)" },
  { label: "VITEEE",        value: "VITEEE",         type: "score", placeholder: "e.g. 95 (score)" },
  { label: "MET",           value: "MET",            type: "score", placeholder: "e.g. 140 (score)" },
  { label: "SRMJEEE",       value: "SRMJEEE",        type: "score", placeholder: "e.g. 110 (score)" },
  { label: "KCET",          value: "KCET",           type: "rank",  placeholder: "e.g. 2000 (rank)" },
  { label: "WBJEE",         value: "WBJEE",          type: "rank",  placeholder: "e.g. 3000 (rank)" },
];

const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"];

const PROB_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  high:   { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "✅ High Likelihood" },
  medium: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", label: "⚡ Medium Likelihood" },
  low:    { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", label: "🎯 Low Likelihood" },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function PredictorPage() {
  const [exam,       setExam]       = useState(EXAMS[0].value);
  const [percentile, setPercentile] = useState("");
  const [category,   setCategory]   = useState("General");
  const [results,    setResults]    = useState<PredictorResult[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [searched,   setSearched]   = useState(false);

  const selectedExam = EXAMS.find((e) => e.value === exam) ?? EXAMS[0];

  async function handlePredict() {
    setError("");
    if (!percentile.trim() || !exam) {
      setError("Please enter your rank, score, or percentile.");
      return;
    }

    const val = parseFloat(percentile);
    if (isNaN(val) || !isFinite(val) || val <= 0) {
      setError(`Please enter a valid positive ${selectedExam.type === "rank" ? "rank" : selectedExam.type === "score" ? "score" : "percentile"}.`);
      return;
    }

    if (selectedExam.type === "pct" && val > 100) {
      setError("Percentile cannot exceed 100. Please enter a valid percentile between 0 and 100.");
      return;
    }

    setLoading(true);
    setResults([]);
    setSearched(false);

    try {
      const params = new URLSearchParams({ exam, percentile, category });
      const res    = await fetch(`/api/predictor?${params.toString()}`);
      const data   = await res.json() as PredictorResponse | { error: string };

      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Prediction failed");
      } else {
        setResults(data.results);
        setSearched(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const high   = results.filter((r) => r.probability === "high");
  const medium  = results.filter((r) => r.probability === "medium");
  const low     = results.filter((r) => r.probability === "low");

  return (
    <AuthGate feature="Predictor">
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
              Admission Predictor
            </h1>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px" }}>
              Enter your exam rank or score to see colleges where your cutoff position is more, moderately, or less favorable.
            </p>
          </div>

          {/* ── INPUT FORM ── */}
          <div style={{
            border: "1px solid #E5E7EB", borderRadius: "12px",
            padding: "24px", marginBottom: "32px",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>

              {/* Exam */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Entrance Exam</label>
                <select
                  value={exam}
                  onChange={(e) => { setExam(e.target.value); setResults([]); setSearched(false); }}
                  style={{
                    padding: "10px 12px", border: "1.5px solid #E5E7EB",
                    borderRadius: "8px", fontSize: "14px", color: "#111827",
                    background: "#fff", outline: "none", cursor: "pointer",
                  }}
                >
                  {EXAMS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>

              {/* Score/Rank/Percentile */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>
                  Your {selectedExam.type === "rank" ? "Rank" : selectedExam.type === "score" ? "Score" : "Percentile"}
                </label>
                <input
                  type="number"
                  value={percentile}
                  onChange={(e) => setPercentile(e.target.value)}
                  placeholder={selectedExam.placeholder}
                  style={{
                    padding: "10px 12px", border: "1.5px solid #E5E7EB",
                    borderRadius: "8px", fontSize: "14px", color: "#111827",
                    background: "#fff", outline: "none",
                  }}
                />
              </div>

              {/* Category */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    padding: "10px 12px", border: "1.5px solid #E5E7EB",
                    borderRadius: "8px", fontSize: "14px", color: "#111827",
                    background: "#fff", outline: "none", cursor: "pointer",
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handlePredict}
              disabled={!percentile || !exam || loading}
              style={{
                padding: "10px 24px", background: (!percentile || loading) ? "#FFBDCA" : "#FF385C",
                color: "#fff", borderRadius: "12px", fontSize: "14px",
                fontWeight: 600, border: "none",
                cursor: (!percentile || loading) ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Predicting…" : "Predict My Colleges →"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#DC2626", borderRadius: "8px",
              padding: "12px 16px", marginBottom: "24px", fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {/* ── RESULTS ── */}
          {searched && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF", fontSize: "14px" }}>
              No colleges found for this exam/score. Try a different exam or score.
            </div>
          )}

          {results.length > 0 && (
            <>
              {/* Summary pills */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                {[
                  { label: "✅ High Likelihood",   count: high.length,   color: "#16A34A" },
                  { label: "⚡ Medium Likelihood", count: medium.length, color: "#D97706" },
                  { label: "🎯 Low Likelihood",    count: low.length,    color: "#DC2626" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{
                    padding: "8px 16px", borderRadius: "20px",
                    border: `1px solid ${color}22`, background: `${color}11`,
                    fontSize: "13px", fontWeight: 600, color,
                  }}>
                    {label}: {count} college{count !== 1 ? "s" : ""}
                  </div>
                ))}
              </div>

              {/* Groups */}
              {[
                { title: "High Likelihood",   data: high,   prob: "high"   as const },
                { title: "Medium Likelihood", data: medium, prob: "medium" as const },
                { title: "Low Likelihood",    data: low,    prob: "low"    as const },
              ].filter((g) => g.data.length > 0).map((group) => (
                <div key={group.prob} style={{ marginBottom: "32px" }}>
                  <h2 style={{
                    fontSize: "15px", fontWeight: 700, color: PROB_STYLES[group.prob].color,
                    marginBottom: "12px",
                  }}>
                    {group.title} ({group.data.length})
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {group.data.map((r) => (
                      <CollegeResultCard key={r.collegeId} result={r} examType={selectedExam.type} />
                    ))}
                  </div>
                </div>
              ))}

              <p style={{ fontSize: "12px", color: "#9CA3AF", textAlign: "center", marginTop: "24px" }}>
                These bands are indicative and based on available cutoff data; they are not a guarantee of admission.
              </p>
            </>
          )}

          {/* Empty state */}
          {!searched && !loading && (
            <div style={{ textAlign: "center", padding: "48px", color: "#9CA3AF" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎓</div>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#374151" }}>
                Enter your exam details above
              </p>
              <p style={{ fontSize: "14px", marginTop: "4px" }}>
                We&apos;ll show you safe, moderate, and reach colleges based on available historical cutoff data.
              </p>
            </div>
          )}

        </div>
      </main>
    </AuthGate>
  );
}

// ── College Result Card ─────────────────────────────────────────────────────

function CollegeResultCard({ result, examType }: { result: PredictorResult; examType?: string }) {
  const style = PROB_STYLES[result.probability];
  const metricLabel =
    examType === "score"
      ? "Last score to get in"
      : examType === "pct"
      ? "Last closing percentile"
      : "Last closing rank";

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 20px", border: `1px solid ${style.border}`,
      borderRadius: "10px", background: style.bg, gap: "12px", flexWrap: "wrap",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Link href={`/colleges/${result.slug}`} style={{
            fontSize: "15px", fontWeight: 700, color: "#111827",
          }}>
            {result.name}
          </Link>
          {result.nirfRank && (
            <span style={{
              fontSize: "11px", fontWeight: 700, background: "#FFF1F2",
              color: "#FF385C", border: "1px solid rgba(255,56,92,0.25)",
              borderRadius: "6px", padding: "1px 6px",
            }}>
              NIRF #{result.nirfRank}
            </span>
          )}
        </div>
        <p style={{ fontSize: "12px", color: "#6B7280" }}>{result.city}</p>
        <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>
          {metricLabel} ({result.cutoffYear}, any branch):{" "}
          <strong>{result.lastClosingRank.toLocaleString("en-IN")}</strong>
        </p>
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
        {result.avgPackage && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: "#6B7280" }}>Avg Package</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>₹{result.avgPackage} LPA</p>
          </div>
        )}
        {result.minFee && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: "#6B7280" }}>Min Fee</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>₹{(result.minFee / 100000).toFixed(1)}L/yr</p>
          </div>
        )}
        <span style={{
          padding: "6px 14px", borderRadius: "20px",
          background: style.color, color: "#fff",
          fontSize: "12px", fontWeight: 700,
        }}>
          {style.label}
        </span>
      </div>
    </div>
  );
}