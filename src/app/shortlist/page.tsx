"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import AuthGate from "@/components/AuthGate";
import {
  getGuestShortlist,
  removeFromGuestShortlist,
  dispatchShortlistChange,
} from "@/lib/guestShortlist";

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

const TYPE_LABEL: Record<string, string> = {
  GOVT: "Government",
  PRIVATE: "Private",
  DEEMED: "Deemed",
};

export default function ShortlistPage() {
  const [colleges, setColleges] = useState<ShortlistCollege[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadShortlist() {
      try {
        // Try authenticated database shortlist first
        const res = await fetch("/api/shortlist/colleges");
        if (res.ok) {
          const data = await res.json() as { colleges?: ShortlistCollege[] };
          if (isMounted) {
            setColleges(data.colleges ?? []);
            setLoading(false);
          }
          return;
        }

        // Fallback to guest shortlist IDs from localStorage
        const ids = getGuestShortlist().map((e) => e.collegeId);
        if (ids.length === 0) {
          if (isMounted) {
            setColleges([]);
            setLoading(false);
          }
          return;
        }

        const params = new URLSearchParams({ ids: ids.join(","), limit: "100" });
        const pubRes = await fetch(`/api/colleges?${params.toString()}`);
        if (pubRes.ok) {
          const data = await pubRes.json() as { colleges?: ShortlistCollege[] };
          if (isMounted) setColleges(data.colleges ?? []);
        } else {
          const results: ShortlistCollege[] = [];
          for (const id of ids) {
            const r = await fetch(`/api/colleges/${id}`);
            if (r.ok) results.push(await r.json() as ShortlistCollege);
          }
          if (isMounted) setColleges(results);
        }
      } catch {
        if (isMounted) {
          setToast({ message: "Could not load shortlist", type: "error" });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadShortlist();

    const handler = () => {
      loadShortlist();
    };
    window.addEventListener("guest-shortlist-change", handler);
    return () => {
      isMounted = false;
      window.removeEventListener("guest-shortlist-change", handler);
    };
  }, []);

  async function remove(collegeId: string) {
    try {
      await fetch("/api/shortlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId }),
      });
    } catch (err) {
      console.error("Failed to delete from DB shortlist", err);
    }
    removeFromGuestShortlist(collegeId);
    setColleges((prev) => prev.filter((c) => c.id !== collegeId));
    dispatchShortlistChange();
    setToast({ message: "Removed from shortlist", type: "success" });
  }

  // Loading
  if (loading) {
    return (
      <AuthGate feature="Shortlist">
        <Navbar />
        <main style={{ minHeight: "100vh", background: "#fff" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>My Shortlist</h1>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px", marginBottom: "28px" }}>Loading…</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: "100px", background: "#F3F4F6", borderRadius: "10px" }} />
              ))}
            </div>
          </div>
        </main>
      </AuthGate>
    );
  }

  return (
    <AuthGate feature="Shortlist">
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>My Shortlist</h1>
          <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px", marginBottom: "28px" }}>
            {`${colleges.length} college${colleges.length !== 1 ? "s" : ""} saved`}
          </p>

          {colleges.length === 0 ? (
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
                  background: "#FF385C",
                  color: "#fff",
                  borderRadius: "12px",
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
                    background: "#FF385C",
                    color: "#fff",
                    borderRadius: "12px",
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
                            color: "#FF385C",
                            background: "#FFF1F2",
                            padding: "2px 8px",
                            borderRadius: "6px",
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
                        background: "#FF385C",
                        color: "#fff",
                        borderRadius: "12px",
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
                        cursor: "pointer",
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
    </AuthGate>
  );
}
