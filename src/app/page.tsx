"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import CollegeCard from "@/components/CollegeCard";
import SkeletonCard from "@/components/SkeletonCard";
import Toast from "@/components/Toast";
import AuthModal from "@/components/AuthModal";

// ─── Types ───────────────────────────────────────────────────────────────────

type College = {
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
  maxPackage: number | null;
  placementPct: number | null;
};

type ApiResponse = {
  data: College[];
  total: number;
  page: number;
  totalPages: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STREAMS = ["Engineering", "Medical", "Commerce", "Law", "Sciences", "Management"];
const TYPES   = [
  { label: "All Types", value: "" },
  { label: "Government", value: "GOVT" },
  { label: "Private",    value: "PRIVATE" },
  { label: "Deemed",     value: "DEEMED" },
];
const SORT_OPTIONS = [
  { label: "NIRF Rank",         value: "nirf" },
  { label: "Avg Placement ↑",   value: "placement" },
  { label: "Fees: Low to High", value: "fees_asc" },
  { label: "Fees: High to Low", value: "fees_desc" },
];
const LIMIT = 9;

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const { data: session, status } = useSession();
  const [colleges,    setColleges]    = useState<College[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [savedIds,    setSavedIds]    = useState<Set<string>>(new Set());
  const [toast,       setToast]       = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Filters
  const [search,     setSearch]      = useState("");
  const [stream,     setStream]      = useState("");
  const [cityFilter, setCityFilter]  = useState("");
  const [typeFilter, setTypeFilter]  = useState("");
  const [feesMax,    setFeesMax]     = useState("");
  const [sort,       setSort]        = useState("nirf");
  const [showMore,   setShowMore]    = useState(false);

  // Debounced search
  const searchTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Fetch colleges
  const fetchColleges = useCallback(async () => {
    setLoading(true);
    setError("");
    const p = new URLSearchParams({
      page:  String(page),
      limit: String(LIMIT),
      sort,
    });
    if (debouncedSearch) p.set("search",   debouncedSearch);
    if (stream)          p.set("stream",   stream);
    if (cityFilter)      p.set("city",     cityFilter);
    if (typeFilter)      p.set("type",     typeFilter);
    if (feesMax)         p.set("fees_max", feesMax);

    try {
      const res  = await fetch(`/api/colleges?${p.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: ApiResponse = await res.json();
      setColleges(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load colleges. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, stream, cityFilter, typeFilter, feesMax, sort]);

  useEffect(() => { fetchColleges(); }, [fetchColleges]);

  // Load shortlisted colleges when logged in
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setSavedIds(new Set());
      return;
    }

    fetch("/api/shortlist")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data: Array<{ collegeId: string }>) => {
        if (Array.isArray(data)) setSavedIds(new Set(data.map((c) => c.collegeId)));
      })
      .catch(() => {});
  }, [session, status]);

  async function handleSaveToggle(collegeId: string, save: boolean) {
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (save) {
        const res = await fetch("/api/shortlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collegeId }),
        });
        if (!res.ok) throw new Error("Failed to save");
        setSavedIds((prev) => new Set([...prev, collegeId]));
        setToast({ message: "Added to shortlist ★", type: "success" });
      } else {
        const res = await fetch("/api/shortlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collegeId }),
        });
        if (!res.ok) throw new Error("Failed to remove");
        setSavedIds((prev) => { const n = new Set(prev); n.delete(collegeId); return n; });
        setToast({ message: "Removed from shortlist", type: "info" });
      }
    } catch (error) {
      console.error("Shortlist error:", error);
      setToast({ message: "Failed to update shortlist", type: "error" });
    }
  }

  function clearFilters() {
    setSearch(""); setDebouncedSearch(""); setStream(""); setCityFilter("");
    setTypeFilter(""); setFeesMax(""); setSort("nirf"); setPage(1);
  }

  const activeFilterCount = [stream, cityFilter, typeFilter, feesMax].filter(Boolean).length;

  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />

      {/* ── SEARCH HEADER ── */}
      <section className="search-header">
        <h1 className="page-title">Find Your College</h1>
        <p className="page-subtitle">
          Search, compare and shortlist from 22+ top Indian colleges
        </p>
        <div className="search-bar-wrapper">
          <input
            id="college-search"
            type="text"
            placeholder="Search by college name, city or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            autoComplete="off"
          />
        </div>
      </section>

      {/* ── FILTERS + RESULTS ── */}
      <section className="content-section">

        {/* Stream chips */}
        <div className="filter-bar">
          <div className="stream-chips">
            <button
              onClick={() => { setStream(""); setPage(1); }}
              className={stream === "" ? "chip chip--active" : "chip"}
            >
              All Streams
            </button>
            {STREAMS.map((s) => (
              <button
                key={s}
                onClick={() => { setStream(stream === s ? "" : s); setPage(1); }}
                className={stream === s ? "chip chip--active" : "chip"}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="filter-right">
            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="filter-select"
              id="type-filter"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="filter-select"
              id="sort-select"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* More filters toggle */}
            <button
              onClick={() => setShowMore(!showMore)}
              className={activeFilterCount > 0 || showMore ? "chip chip--active" : "chip"}
              id="more-filters-btn"
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="chip chip--clear">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Expandable filter panel */}
        {showMore && (
          <div className="filter-panel">
            <div className="filter-group">
              <label className="filter-label" htmlFor="city-input">City</label>
              <input
                id="city-input"
                type="text"
                placeholder="e.g. Mumbai"
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="fees-input">Max Annual Fees (₹)</label>
              <input
                id="fees-input"
                type="number"
                placeholder="e.g. 200000"
                value={feesMax}
                onChange={(e) => { setFeesMax(e.target.value); setPage(1); }}
                className="filter-input"
              />
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="results-header">
          <h2 className="results-count">
            {loading ? "Loading..." : `${total} College${total !== 1 ? "s" : ""}`}
          </h2>
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">
            {error}{" "}
            <button onClick={fetchColleges} className="error-retry">Retry</button>
          </div>
        )}

        {/* College grid */}
        <div className="college-grid">
          {loading
            ? [...Array(LIMIT)].map((_, i) => <SkeletonCard key={i} />)
            : colleges.length > 0
            ? colleges.map((college) => (
                <CollegeCard
                  key={college.id}
                  {...college}
                  isSaved={savedIds.has(college.id)}
                  onSaveToggle={handleSaveToggle}
                />
              ))
            : !error && (
                <div className="empty-state">
                  <p className="empty-title">No colleges found</p>
                  <p className="empty-sub">Try adjusting your filters</p>
                  <button onClick={clearFilters} className="btn-link">
                    Clear all filters
                  </button>
                </div>
              )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="page-btn"
            >
              ← Prev
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={page === p ? "page-btn page-btn--active" : "page-btn"}
                  >
                    {p}
                  </button>
                );
              }
              if (Math.abs(p - page) === 2) return <span key={p} className="page-ellipsis">…</span>;
              return null;
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="page-btn"
            >
              Next →
            </button>
          </div>
        )}
      </section>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </main>
  );
}
