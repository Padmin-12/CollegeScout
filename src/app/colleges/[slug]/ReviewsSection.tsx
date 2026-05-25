"use client";

import { useState } from "react";

type Review = {
  id: string;
  authorName: string;
  batchYear: number;
  stream: string;
  ratingOverall: number;
  ratingPlacement: number;
  ratingFaculty: number;
  ratingInfra: number;
  body: string;
  createdAt: Date;
};

type Props = {
  collegeId: string;
  initialReviews: Review[];
};

const RATING_FIELDS = [
  { key: "ratingOverall",   label: "Overall" },
  { key: "ratingPlacement", label: "Placements" },
  { key: "ratingFaculty",   label: "Faculty" },
  { key: "ratingInfra",     label: "Infrastructure" },
] as const;

type RatingKey = typeof RATING_FIELDS[number]["key"];

const defaultForm = {
  authorName: "",
  batchYear:  new Date().getFullYear(),
  stream:     "",
  body:       "",
  ratingOverall:   5,
  ratingPlacement: 5,
  ratingFaculty:   5,
  ratingInfra:     5,
};

export default function ReviewsSection({ collegeId, initialReviews }: Props) {
  const [reviews,      setReviews]      = useState<Review[]>(initialReviews);
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState(defaultForm);
  const [submitting,   setSubmitting]   = useState(false);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [successMsg,   setSuccessMsg]   = useState("");

  function setField(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/colleges/${collegeId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as
        | { error: string; fields?: Record<string, string> }
        | Review;

      if (!res.ok) {
        if ("fields" in data && data.fields) {
          setErrors(data.fields);
        } else if ("error" in data) {
          setErrors({ _global: data.error });
        }
      } else {
        setSuccessMsg("Review submitted! It will appear after moderation.");
        setForm(defaultForm);
        setShowForm(false);
      }
    } catch {
      setErrors({ _global: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Existing reviews */}
      {reviews.length === 0 ? (
        <p style={{ color: "#9CA3AF", fontSize: "14px", marginBottom: "20px" }}>
          No reviews yet. Be the first to write one!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {/* Toggle form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "9px 18px", border: "1.5px solid #006AFF", color: "#006AFF",
            borderRadius: "8px", fontSize: "14px", fontWeight: 600, background: "#fff",
            cursor: "pointer",
          }}
        >
          Write a Review
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{
          border: "1px solid #E5E7EB", borderRadius: "10px", padding: "24px",
          display: "flex", flexDirection: "column", gap: "16px",
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
            Write a Review
          </h3>

          {errors._global && (
            <p style={{ color: "#DC2626", fontSize: "13px" }}>{errors._global}</p>
          )}
          {successMsg && (
            <p style={{ color: "#16A34A", fontSize: "13px" }}>{successMsg}</p>
          )}

          {/* Name + Batch year */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Your Name" error={errors.authorName}>
              <input
                value={form.authorName}
                onChange={(e) => setField("authorName", e.target.value)}
                placeholder="e.g. Rahul Sharma"
                style={inputStyle}
              />
            </Field>
            <Field label="Batch Year" error={errors.batchYear}>
              <input
                type="number"
                min={2000}
                max={new Date().getFullYear()}
                value={form.batchYear}
                onChange={(e) => setField("batchYear", parseInt(e.target.value, 10))}
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Stream */}
          <Field label="Stream / Branch" error={errors.stream}>
            <input
              value={form.stream}
              onChange={(e) => setField("stream", e.target.value)}
              placeholder="e.g. Computer Science"
              style={inputStyle}
            />
          </Field>

          {/* Ratings */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
              Ratings
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {RATING_FIELDS.map(({ key, label }) => (
                <Field key={key} label={label} error={errors[key]}>
                  <select
                    value={form[key]}
                    onChange={(e) => setField(key, parseFloat(e.target.value))}
                    style={inputStyle}
                  >
                    {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((v) => (
                      <option key={v} value={v}>{v} ★</option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          </div>

          {/* Body */}
          <Field label={`Review (min 80 characters — ${form.body.length}/80)`} error={errors.body}>
            <textarea
              value={form.body}
              onChange={(e) => setField("body", e.target.value)}
              rows={4}
              placeholder="Share your honest experience about academics, placements, campus life..."
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "9px 20px", background: submitting ? "#93C5FD" : "#006AFF",
                color: "#fff", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
                border: "none", cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setErrors({}); }}
              style={{
                padding: "9px 20px", border: "1.5px solid #E5E7EB", color: "#374151",
                borderRadius: "8px", fontSize: "14px", background: "#fff", cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Review Card ────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

  return (
    <div style={{
      border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          <p style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>{review.authorName}</p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
            {review.stream} · Batch {review.batchYear}
          </p>
        </div>
        <span style={{ fontSize: "15px", color: "#F59E0B", letterSpacing: "1px" }}>
          {stars(review.ratingOverall)}
        </span>
      </div>

      <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.6, marginBottom: "12px" }}>
        {review.body}
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[
          { label: "Placement", val: review.ratingPlacement },
          { label: "Faculty",   val: review.ratingFaculty },
          { label: "Infra",     val: review.ratingInfra },
        ].map(({ label, val }) => (
          <span key={label} style={{ fontSize: "12px", color: "#6B7280" }}>
            {label}: <strong style={{ color: "#111827" }}>{val}</strong>/5
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: "12px", color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1.5px solid #E5E7EB",
  borderRadius: "6px",
  fontSize: "14px",
  color: "#111827",
  background: "#fff",
  outline: "none",
  width: "100%",
};
