import { summarizeCutoffs, cutoffValueLabel, type CutoffRow, type CutoffSummary } from "@/lib/cutoffs";

type Props = { cutoffs: CutoffRow[] };

export default function CutoffsSection({ cutoffs }: Props) {
  const summaries = summarizeCutoffs(cutoffs);

  if (!summaries.length) return null;

  // Show latest year per exam (General first when present)
  const byExam = new Map<string, CutoffSummary>();
  for (const s of summaries) {
    const existing = byExam.get(s.exam);
    if (!existing || s.year > existing.year) {
      byExam.set(s.exam, s);
      continue;
    }
    if (
      s.year === existing.year &&
      s.category === "General" &&
      existing.category !== "General"
    ) {
      byExam.set(s.exam, s);
    }
  }

  const headline = [...byExam.values()].sort((a: CutoffSummary, b: CutoffSummary) => a.exam.localeCompare(b.exam));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>
        <strong>Last closing rank</strong> is the highest rank/score at which someone got a seat in{" "}
        <em>any</em> branch — if your rank is better (lower) than this number, you have a shot at
        entering the college.
      </p>

      {headline.map((s) => (
        <div
          key={`${s.exam}-${s.year}-${s.category}`}
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              background: "#F9FAFB",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              {s.exam} · {s.year} · {s.category}
            </p>
            <p style={{ fontSize: "15px", color: "#374151" }}>
              Last {cutoffValueLabel(s.exam).toLowerCase()} to get in (any branch):{" "}
              <strong style={{ fontSize: "1.35rem", color: "#006AFF" }}>
                {s.lastClosingRank.toLocaleString("en-IN")}
              </strong>
              <span style={{ fontSize: "13px", color: "#9CA3AF", marginLeft: "8px" }}>
                ({s.easiestBranch})
              </span>
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#fff" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 20px",
                    color: "#9CA3AF",
                    fontWeight: 600,
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Branch
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "10px 20px",
                    color: "#9CA3AF",
                    fontWeight: 600,
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  {cutoffValueLabel(s.exam)}
                </th>
              </tr>
            </thead>
            <tbody>
              {s.branches.map((b) => (
                <tr key={b.branch}>
                  <td style={{ padding: "10px 20px", color: "#374151", borderBottom: "1px solid #F3F4F6" }}>
                    {b.branch}
                  </td>
                  <td
                    style={{
                      padding: "10px 20px",
                      textAlign: "right",
                      fontWeight: 600,
                      color: "#111827",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    {b.cutoffValue.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Other categories / years — collapsed detail */}
      {summaries.length > headline.length && (
        <details style={{ fontSize: "13px", color: "#6B7280" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, color: "#006AFF" }}>
            All categories & years ({summaries.length} records)
          </summary>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {summaries.map((s) => (
              <div
                key={`all-${s.exam}-${s.year}-${s.category}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                }}
              >
                <span>
                  {s.exam} · {s.year} · {s.category}
                </span>
                <span style={{ fontWeight: 600 }}>
                  Last: {s.lastClosingRank.toLocaleString("en-IN")} ({s.easiestBranch})
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
