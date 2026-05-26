"use client";

import { useEffect, useState } from "react";

type CareerTrends = {
  placementYear: number;
  topRecruiters: {
    name: string;
    industry: string;
    salaryRange: { min: number; max: number };
    growth: "High Growth" | "Stable" | "Declining";
  }[];
  roleClusters: { title: string; count: number; avgSalary: number }[];
  growthDistribution: { highGrowth: number; stable: number; declining: number };
};

const GROWTH_STYLE: Record<string, { bg: string; color: string }> = {
  "High Growth": { bg: "#F0FDF4", color: "#16A34A" },
  Stable:        { bg: "#F9FAFB", color: "#6B7280" },
  Declining:     { bg: "#FEF2F2", color: "#DC2626" },
};

export default function CareerTrendsSection({ collegeSlug }: { collegeSlug: string }) {
  const [data, setData] = useState<CareerTrends | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/colleges/${collegeSlug}/careerTrends`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: CareerTrends) => setData(d))
      .catch(() => setError(true));
  }, [collegeSlug]);

  if (error || !data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <p style={{ fontSize: "13px", color: "#6B7280" }}>
        Based on {data.placementYear} placement recruiters — industry & salary intelligence.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {data.topRecruiters.slice(0, 8).map((r) => {
          const style = GROWTH_STYLE[r.growth] ?? GROWTH_STYLE.Stable;
          return (
            <div
              key={r.name}
              style={{
                padding: "12px 14px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                minWidth: "140px",
                flex: "1 1 160px",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>{r.name}</p>
              <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{r.industry}</p>
              <p style={{ fontSize: "12px", color: "#374151", marginTop: "6px" }}>
                ₹{(r.salaryRange.min / 100000).toFixed(0)}–{(r.salaryRange.max / 100000).toFixed(0)} LPA
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: "6px",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: style.bg,
                  color: style.color,
                }}
              >
                {r.growth}
              </span>
            </div>
          );
        })}
      </div>

      <div>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "8px" }}>
          Role clusters
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {data.roleClusters.slice(0, 5).map((role) => (
            <div
              key={role.title}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            >
              <span>{role.title}</span>
              <span style={{ color: "#6B7280" }}>
                {role.count} offers · ₹{(role.avgSalary / 100000).toFixed(1)}L avg
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
