"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import CollegeCard from "@/components/CollegeCard";
import SkeletonCard from "@/components/SkeletonCard";
import Toast from "@/components/Toast";
import Link from "next/link";

type College = {
  id: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  placements: string;
  examCutoff: string;
  highestPackage: string;
};

type ApiResponse = {
  data: College[];
  total: number;
  page: number;
  totalPages: number;
};

const EXAMS = ["JEE", "MHT-CET", "KCET", "WBJEE", "BITSAT", "VITEEE", "SRMJEE"];
const RATINGS = [
  { label: "Any", value: "" },
  { label: "3.5+", value: "3.5" },
  { label: "4.0+", value: "4.0" },
  { label: "4.5+", value: "4.5" },
];
const LIMIT = 9;

export default function Home() {
  const { data: session } = useSession();

  const [colleges, setColleges] = useState<College[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxFees, setMaxFees] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Saved colleges (set of IDs)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Debounce search
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  const fetchColleges = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (examFilter) params.set("exam", examFilter);
    if (minRating) params.set("minRating", minRating);
    if (maxFees) params.set("maxFees", maxFees);

    try {
      const res = await fetch(`/api/colleges?${params.toString()}`);
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
  }, [page, debouncedSearch, examFilter, minRating, maxFees]);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  // Load saved IDs when session available
  useEffect(() => {
    if (!session) return;
    fetch("/api/saved")
      .then((r) => r.json())
      .then((data: College[]) => {
        if (Array.isArray(data)) {
          setSavedIds(new Set(data.map((c) => c.id)));
        }
      })
      .catch(() => {});
  }, [session]);

  async function handleSaveToggle(collegeId: string, save: boolean) {
    if (!session) {
      setToast({ message: "Sign in to save colleges to your shortlist", type: "info" });
      return;
    }

    try {
      if (save) {
        await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collegeId }),
        });
        setSavedIds((prev) => new Set([...prev, collegeId]));
        setToast({ message: "Added to your shortlist ★", type: "success" });
      } else {
        await fetch("/api/saved", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collegeId }),
        });
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(collegeId);
          return next;
        });
        setToast({ message: "Removed from shortlist", type: "info" });
      }
    } catch {
      setToast({ message: "Failed to update shortlist", type: "error" });
    }
  }

  function clearFilters() {
    setSearch("");
    setExamFilter("");
    setMinRating("");
    setMaxFees("");
    setPage(1);
  }

  const activeFilterCount = [examFilter, minRating, maxFees].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO */}
      <section className="px-4 sm:px-6 py-20 text-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight">
          Discover Your Ideal College
        </h1>
        <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-xl mx-auto">
          Search, compare, and evaluate top Indian engineering colleges based on fees, placements, and rankings.
        </p>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Search by college name, location, or branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg text-sm sm:text-base"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200 text-lg">
            🔍
          </span>
        </div>
      </section>

      {/* FILTERS + CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {debouncedSearch || examFilter || minRating || maxFees
                ? `Results (${total})`
                : `All Colleges (${total})`}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Exam filter chips */}
            <div className="flex gap-1.5 flex-wrap">
              {EXAMS.map((exam) => (
                <button
                  key={exam}
                  onClick={() => {
                    setExamFilter(examFilter === exam ? "" : exam);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    examFilter === exam
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {exam}
                </button>
              ))}
            </div>

            {/* More filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                activeFilterCount > 0 || showFilters
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              ⚙ Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            {(activeFilterCount > 0 || examFilter) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-full hover:bg-red-50 transition"
              >
                Clear all
              </button>
            )}

            <Link
              href="/compare"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-medium transition"
            >
              Compare →
            </Link>
          </div>
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-6">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Min Rating
              </label>
              <div className="flex gap-1.5">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => { setMinRating(r.value); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                      minRating === r.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Max Annual Fees (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 200000"
                value={maxFees}
                onChange={(e) => { setMaxFees(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
            {error}{" "}
            <button onClick={fetchColleges} className="underline font-medium ml-2">
              Retry
            </button>
          </div>
        )}

        {/* College grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <div className="col-span-full bg-white p-14 rounded-2xl text-center border border-gray-100 shadow-sm">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    No colleges found
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Try adjusting your search or filters.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 font-medium hover:underline text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
            >
              ← Prev
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (
                p === 1 ||
                p === totalPages ||
                Math.abs(p - page) <= 1
              ) {
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      page === p
                        ? "bg-blue-600 text-white"
                        : "border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {p}
                  </button>
                );
              }
              if (Math.abs(p - page) === 2) {
                return <span key={p} className="text-gray-400">…</span>;
              }
              return null;
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
            >
              Next →
            </button>
          </div>
        )}
      </section>

      {/* PREDICTOR CTA */}
      <section className="px-4 sm:px-6 pb-12 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Not sure which colleges you qualify for?
          </h2>
          <p className="text-blue-100 mb-6 text-sm sm:text-base">
            Enter your JEE/MHT-CET rank and get personalized college recommendations instantly.
          </p>
          <Link
            href="/predictor"
            className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Try Rank Predictor →
          </Link>
        </div>
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}