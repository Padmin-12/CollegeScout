import Link from "next/link";

type CollegeCardProps = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  type: "GOVT" | "PRIVATE" | "DEEMED";
  streams: string[];
  nirfRank: number | null;
  minAnnualFee: number | null;
  avgPackage: number | null;
  placementPct: number | null;
  isSaved: boolean;
  onSaveToggle: (id: string, save: boolean) => void;
};

const TYPE_LABEL: Record<string, string> = {
  GOVT:    "Government",
  PRIVATE: "Private",
  DEEMED:  "Deemed",
};

export default function CollegeCard({
  id,
  slug,
  name,
  city,
  state,
  type,
  streams,
  nirfRank,
  minAnnualFee,
  avgPackage,
  placementPct,
  isSaved,
  onSaveToggle,
}: CollegeCardProps) {
  return (
    <div className="college-card">
      {/* NIRF badge */}
      {nirfRank && (
        <div className="nirf-badge">NIRF #{nirfRank}</div>
      )}

      <div className="card-body">
        {/* Header */}
        <div className="card-header">
          <Link href={`/colleges/${slug}`} className="card-title">
            {name}
          </Link>
          <span className="type-chip">{TYPE_LABEL[type] ?? type}</span>
        </div>

        {/* Location */}
        <p className="card-location">
          {city}, {state}
        </p>

        {/* Streams */}
        {streams.length > 0 && (
          <div className="stream-tags">
            {streams.slice(0, 2).map((s) => (
              <span key={s} className="stream-tag">{s}</span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="card-stats">
          <div className="stat">
            <span className="stat-label">Avg Package</span>
            <span className="stat-value">
              {avgPackage != null ? `₹${avgPackage} LPA` : "N/A"}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Placed</span>
            <span className="stat-value">
              {placementPct != null ? `${placementPct}%` : "N/A"}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Min Fees</span>
            <span className="stat-value">
              {minAnnualFee != null
                ? `₹${(minAnnualFee / 100000).toFixed(1)}L/yr`
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="card-actions">
          <Link href={`/colleges/${slug}`} className="btn-primary">
            View Details
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              onSaveToggle(id, !isSaved);
            }}
            className={isSaved ? "btn-saved" : "btn-save"}
            aria-label={isSaved ? "Remove from shortlist" : "Add to shortlist"}
          >
            {isSaved ? "★ Shortlisted" : "☆ Shortlist"}
          </button>
        </div>
      </div>
    </div>
  );
}