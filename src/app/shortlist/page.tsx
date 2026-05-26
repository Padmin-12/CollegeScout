"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";

type ShortlistCollege = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  type: string;
  nirfRank: number | null;
  avgPackage: number | null;
  maxPackage: number | null;
  placementPct: number | null;
  minFee: number | null;
};

function getSessionId(): string {
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}

const TYPE_LABEL: Record<string, string> = {
  GOVT: "Government",
  PRIVATE: "Private",
  DEEMED: "Deemed",
};

export default function ShortlistPage() {
  const [colleges, setColleges] = useState<ShortlistCollege[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchShortlist = useCallback(async () => {
    setLoading(true);
    const sessionId = getSessionId();
    try {
      const res = await fetch(`/api/shortlist/${encodeURIComponent(sessionId)}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { colleges: ShortlistCollege[] };
      setColleges(data.colleges ?? []);
    } catch {
      setToast({ message: "Could not load shortlist", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShortlist();
  }, [fetchShortlist]);

  async function remove(collegeId: string) {
    const sessionId = getSessionId();
    try {
      await fetch("/api/shortlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-session-id": sessionId },
        body: JSON.stringify({ collegeId }),
      });
      setColleges((prev) => prev.filter((c) => c.id !== collegeId));
      setToast({ message: "Removed from shortlist", type: "success" });
    } catch {
      setToast({ message: "Failed to remove", type: "error" });
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>My Shortlist</h1>
          <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px", marginBottom: "28px" }}>
            {loading
              ? "Loading…"
              : `${colleges.length} college${colleges.length !== 1 ? "s" : ""} saved on this device`}
          </p>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ height: "100px", background: "#F3F4F6", borderRadius: "10px" }}
                />
              ))}
            </div>
          ) : colleges.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
              }}
            >
              <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>☆</p>
              <p style={{ fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                No colleges shortlisted yet
              </p>
              <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "20px" }}>
                Tap ☆ Shortlist on any college card or detail page.
              </p>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  background: "#006AFF",
                  color: "#fff",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Browse Colleges
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {colleges.length >= 2 && (
                <Link
                  href={`/compare?ids=${colleges.map((c) => c.slug).join(",")}`}
                  style={{
                    alignSelf: "flex-start",
                    marginBottom: "8px",
                    padding: "8px 16px",
                    background: "#006AFF",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Compare all shortlisted →
                </Link>
              )}
              {colleges.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    padding: "18px 20px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <Link
                        href={`/colleges/${c.slug}`}
                        style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}
                      >
                        {c.name}
                      </Link>
                      {c.nirfRank && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#006AFF",
                            background: "#EFF6FF",
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          NIRF #{c.nirfRank}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>
                      {c.city}, {c.state} · {TYPE_LABEL[c.type] ?? c.type}
                    </p>
                    <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px", color: "#6B7280" }}>
                      {c.avgPackage != null && <span>Avg ₹{c.avgPackage} LPA</span>}
                      {c.minFee != null && (
                        <span>From ₹{(c.minFee / 100000).toFixed(1)}L/yr</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link
                      href={`/colleges/${c.slug}`}
                      style={{
                        padding: "8px 14px",
                        background: "#006AFF",
                        color: "#fff",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      style={{
                        padding: "8px 14px",
                        border: "1px solid #FECACA",
                        color: "#DC2626",
                        borderRadius: "8px",
                        fontSize: "13px",
                        background: "#fff",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
