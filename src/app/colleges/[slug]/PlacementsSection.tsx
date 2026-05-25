"use client";

type PlacementStat = {
  id: string;
  year: number;
  avgPackage: number;
  maxPackage: number;
  placementPct: number;
  topRecruiters: string[];
};

export default function PlacementsSection({ stats }: { stats: PlacementStat[] }) {
  const maxPkg = Math.max(...stats.map((s) => s.maxPackage));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {stats.map((stat) => (
        <div key={stat.id}>
          {/* Year header */}
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#006AFF", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {stat.year}
          </p>

          {/* Package bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            <Bar
              label="Avg Package"
              value={stat.avgPackage}
              max={maxPkg}
              display={`₹${stat.avgPackage} LPA`}
              color="#006AFF"
            />
            <Bar
              label="Highest Package"
              value={stat.maxPackage}
              max={maxPkg}
              display={`₹${stat.maxPackage} LPA`}
              color="#16A34A"
            />
          </div>

          {/* Placement % */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>Students Placed</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{stat.placementPct}%</span>
            </div>
            <div style={{ height: "6px", background: "#F3F4F6", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${stat.placementPct}%`,
                background: "#006AFF", borderRadius: "99px",
              }} />
            </div>
          </div>

          {/* Top Recruiters */}
          {stat.topRecruiters.length > 0 && (
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                Top Recruiters
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {stat.topRecruiters.map((r) => (
                  <span key={r} style={{
                    padding: "4px 10px", borderRadius: "4px",
                    background: "#F9FAFB", border: "1px solid #E5E7EB",
                    fontSize: "12px", fontWeight: 500, color: "#374151",
                  }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  display,
  color,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{display}</span>
      </div>
      <div style={{ height: "8px", background: "#F3F4F6", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "99px" }} />
      </div>
    </div>
  );
}
