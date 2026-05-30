"use client";

import { useState, useEffect, useCallback } from "react";

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
  createdAt: string;
};

type Aggregates = {
  overall: number;
  placement: number;
  faculty: number;
  infra: number;
  count: number;
};

type Props = {
  collegeSlug: string;
  initialReviews: Review[];
};

const RATING_FIELDS = [
  { key: "ratingOverall", label: "Overall" },
  { key: "ratingPlacement", label: "Placements" },
  { key: "ratingFaculty", label: "Faculty" },
  { key: "ratingInfra", label: "Infrastructure" },
] as const;

const defaultForm = {
  authorName: "",
  batchYear: new Date().getFullYear(),
  stream: "",
  body: "",
  ratingOverall: 5,
  ratingPlacement: 5,
  ratingFaculty: 5,
  ratingInfra: 5,
};

const CURRENT_YEAR = new Date().getFullYear();

export default function ReviewsSection({ collegeSlug, initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  const fetchReviews = useCallback(async (pageNum: number, append: boolean) => {
    const res = await fetch(
      `/api/colleges/${collegeSlug}/reviews?page=${pageNum}&limit=10`
    );
    if (!res.ok) return;
    const data = await res.json() as {
      data: Review[];
      totalPages: number;
      aggregates: Aggregates | null;
    };
    setAggregates(data.aggregates);
    setTotalPages(data.totalPages);
    setReviews((prev) => (append ? [...prev, ...data.data] : data.data));
  }, [collegeSlug]);

  useEffect(() => {
    fetchReviews(1, false);
  }, [fetchReviews]);

  function setField(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  }

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    await fetchReviews(next, true);
    setPage(next);
    setLoadingMore(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/colleges/${collegeSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as
        | { error: string; fields?: Record<string, string> }
        | Review;

      if (!res.ok) {
        if ("fields" in data && data.fields) {
          setErrors(data.fields);
        } else if ("error" in data) {
          setErrors({ _global: data.error });
        }
      } else {
        setSuccessMsg(
          "Review submitted! It will appear after moderation. Admins can approve at /admin/reviews."
        );
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
      {aggregates && aggregates.count > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {[
            { label: "Overall", val: aggregates.overall },
            { label: "Placements", val: aggregates.placement },
            { label: "Faculty", val: aggregates.faculty },
            { label: "Infrastructure", val: aggregates.infra },
          ].map(({ label, val }) => (
            <div
              key={label}
              style={{
                textAlign: "center",
                padding: "12px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
            >
              <p style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {reviews.length === 0 ? (
        <p style={{ color: "#9CA3AF", fontSize: "14px", marginBottom: "20px" }}>
          No approved reviews yet. Be the first to write one!
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {page < totalPages && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          style={{
            marginBottom: "20px",
            padding: "8px 16px",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            fontSize: "13px",
            background: "#fff",
            cursor: loadingMore ? "not-allowed" : "pointer",
          }}
        >
          {loadingMore ? "Loading…" : "Load more reviews"}
        </button>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            padding: "9px 18px",
            border: "1.5px solid #FF385C",
            color: "#FF385C",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            background: "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Write a Review
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Write a Review</h3>

          {errors._global && (
            <p style={{ color: "#DC2626", fontSize: "13px" }}>{errors._global}</p>
          )}
          {successMsg && (
            <p style={{ color: "#16A34A", fontSize: "13px" }}>{successMsg}</p>
          )}

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
                min={2010}
                max={CURRENT_YEAR}
                value={form.batchYear}
                onChange={(e) => setField("batchYear", parseInt(e.target.value, 10))}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Stream / Branch" error={errors.stream}>
            <input
              value={form.stream}
              onChange={(e) => setField("stream", e.target.value)}
              placeholder="e.g. Computer Science"
              style={inputStyle}
            />
          </Field>

          <div>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#6B7280",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Ratings
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {RATING_FIELDS.map(({ key, label }) => (
                <Field key={key} label={label} error={errors[key]}>
                  <select
                    value={form[key as keyof typeof form] as number}
                    onChange={(e) => setField(key, parseFloat(e.target.value))}
                    style={inputStyle}
                  >
                    {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((v) => (
                      <option key={v} value={v}>
                        {v} ★
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          </div>

          <Field
            label={`Review (min 80 characters — ${form.body.length}/80)`}
            error={errors.body}
          >
            <textarea
              value={form.body}
              onChange={(e) => setField("body", e.target.value)}
              rows={4}
              placeholder="Share your honest experience about academics, placements, campus life..."
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "9px 20px",
                background: submitting ? "#FFBDCA" : "#FF385C",
                color: "#fff",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setErrors({});
              }}
              style={{
                padding: "9px 20px",
                border: "1.5px solid #DDDDDD",
                color: "#222222",
                borderRadius: "12px",
                fontSize: "14px",
                background: "#fff",
                cursor: "pointer",
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

function ReviewCard({ review }: { review: Review }) {
  const stars = (n: number) =>
    "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

  return (
    <div
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: "10px",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <div>
          <p style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>
            {review.authorName}
          </p>
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
          { label: "Faculty", val: review.ratingFaculty },
          { label: "Infra", val: review.ratingInfra },
        ].map(({ label, val }) => (
          <span key={label} style={{ fontSize: "12px", color: "#6B7280" }}>
            {label}: <strong style={{ color: "#111827" }}>{val}</strong>/5
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
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
  border: "1.5px solid #DDDDDD",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#222222",
  background: "#fff",
  outline: "none",
  width: "100%",
};
