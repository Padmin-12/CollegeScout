export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line" style={{ width: "60px", height: "20px", marginBottom: "12px" }} />
      <div className="skeleton-line" style={{ width: "80%", height: "20px", marginBottom: "8px" }} />
      <div className="skeleton-line" style={{ width: "50%", height: "14px", marginBottom: "16px" }} />
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        <div className="skeleton-line" style={{ width: "80px", height: "20px" }} />
        <div className="skeleton-line" style={{ width: "80px", height: "20px" }} />
      </div>
      <div
        style={{
          display: "flex",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "16px",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1, padding: "10px 8px", borderRight: i < 3 ? "1px solid #E5E7EB" : "none" }}>
            <div className="skeleton-line" style={{ width: "60%", height: "10px", marginBottom: "4px" }} />
            <div className="skeleton-line" style={{ width: "80%", height: "14px" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <div className="skeleton-line" style={{ flex: 1, height: "34px", borderRadius: "8px" }} />
        <div className="skeleton-line" style={{ width: "100px", height: "34px", borderRadius: "8px" }} />
      </div>
    </div>
  );
}
