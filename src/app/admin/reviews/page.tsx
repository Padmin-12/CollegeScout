"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

type PendingReview = {
  id: string;
  authorName: string;
  batchYear: number;
  stream: string;
  ratingOverall: number;
  body: string;
  createdAt: string;
  college: { name: string; slug: string };
};

export default function AdminReviewsPage() {
  const [adminKey, setAdminKey] = useState("");
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPending() {
    if (!adminKey.trim()) {
      setMessage("Enter your admin API key first.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/reviews?status=PENDING&limit=50", {
        headers: { "x-admin-key": adminKey.trim() },
      });
      const data = await res.json() as { data?: PendingReview[]; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Unauthorized — check ADMIN_API_KEY in .env");
        setReviews([]);
      } else {
        setReviews(data.data ?? []);
        setMessage(`${(data.data ?? []).length} pending review(s)`);
      }
    } catch {
      setMessage("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  async function moderate(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/reviews/${id}/${action}`, {
      method: "POST",
      headers: { "x-admin-key": adminKey.trim() },
    });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setMessage(`Review ${action}d. It will ${action === "approve" ? "now appear" : "not appear"} on the college page.`);
    } else {
      setMessage(`Failed to ${action} review`);
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#F9FAFB" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px 80px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "8px" }}>
            Review Moderation
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
            Internal tool — uses <code style={{ background: "#E5E7EB", padding: "2px 6px", borderRadius: "4px" }}>ADMIN_API_KEY</code> from your .env file.
            Approved reviews show on college detail pages.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="password"
              placeholder="Admin API key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "10px 12px",
                border: "1.5px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            <button
              type="button"
              onClick={loadPending}
              disabled={loading}
              style={{
                padding: "10px 20px",
                background: "#006AFF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Loading…" : "Load pending"}
            </button>
          </div>

          {message && (
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "16px" }}>{message}</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reviews.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "10px",
                  padding: "18px",
                }}
              >
                <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "4px" }}>
                  <a href={`/colleges/${r.college.slug}`} style={{ color: "#006AFF" }}>
                    {r.college.name}
                  </a>
                  {" · "}
                  {r.stream} · Batch {r.batchYear}
                </p>
                <p style={{ fontWeight: 700, fontSize: "14px" }}>{r.authorName}</p>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "8px 0" }}>
                  Overall: {r.ratingOverall}/5
                </p>
                <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.5, marginBottom: "12px" }}>
                  {r.body}
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => moderate(r.id, "approve")}
                    style={{
                      padding: "8px 16px",
                      background: "#16A34A",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => moderate(r.id, "reject")}
                    style={{
                      padding: "8px 16px",
                      background: "#fff",
                      color: "#DC2626",
                      border: "1px solid #FECACA",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
