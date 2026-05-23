"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

type College = {
  id: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  placements: string;
  courses: string;
  topRecruiters: string;
  examCutoff: string;
  highestPackage: string;
  facilities: string;
};

const METRICS = [
  { key: "location", label: "📍 Location", type: "text" },
  { key: "fees", label: "💰 Annual Fees", type: "fees", better: "lower" },
  { key: "rating", label: "⭐ Rating", type: "rating", better: "higher" },
  { key: "placements", label: "📈 Avg Placement", type: "text" },
  { key: "highestPackage", label: "🏆 Highest Package", type: "text" },
  { key: "courses", label: "📚 Courses", type: "text" },
  { key: "topRecruiters", label: "🏢 Top Recruiters", type: "text" },
  { key: "facilities", label: "🏛️ Facilities", type: "text" },
  { key: "examCutoff", label: "🎯 Exam Cutoff", type: "text" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

function getBetterIndex(
  colleges: College[],
  key: MetricKey,
  better: "higher" | "lower"
): number {
  if (colleges.length < 2) return -1;
  const a = colleges[0][key];
  const b = colleges[1][key];
  if (typeof a === "number" && typeof b === "number") {
    if (a === b) return -1;
    return better === "higher" ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
  }
  return -1;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const preloadId = searchParams.get("id") || "";

  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [college1, setCollege1] = useState(preloadId);
  const [college2, setCollege2] = useState("");
  const [compared, setCompared] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/colleges?limit=50");
      const data = await res.json();
      setAllColleges(data.data || []);
      setFetching(false);
    }
    load();
  }, []);

  async function handleCompare() {
    if (!college1 || !college2) return;
    setLoading(true);
    const res = await fetch(`/api/compare?id1=${college1}&id2=${college2}`);
    const data = await res.json();
    setCompared(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Compare Colleges
          </h1>
          <p className="text-gray-500 mb-8 text-sm">
            Select two colleges to compare them side-by-side across key metrics.
          </p>

          {/* SELECTORS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={college1}
                onChange={(e) => setCollege1(e.target.value)}
                className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={fetching}
              >
                <option value="">
                  {fetching ? "Loading..." : "Select First College"}
                </option>
                {allColleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-center text-gray-400 font-semibold text-sm">
                VS
              </div>

              <select
                value={college2}
                onChange={(e) => setCollege2(e.target.value)}
                className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={fetching}
              >
                <option value="">
                  {fetching ? "Loading..." : "Select Second College"}
                </option>
                {allColleges
                  .filter((c) => c.id !== college1)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>

              <button
                onClick={handleCompare}
                disabled={!college1 || !college2 || loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition"
              >
                {loading ? "Comparing..." : "Compare"}
              </button>
            </div>
          </div>

          {/* COMPARISON TABLE */}
          {compared.length === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Sticky header */}
              <div className="grid grid-cols-3 bg-gradient-to-r from-blue-600 to-indigo-700 sticky top-16 z-10">
                <div className="p-4 text-sm font-semibold text-blue-200 uppercase tracking-wide">
                  Metric
                </div>
                {compared.map((c) => (
                  <div key={c.id} className="p-4 border-l border-blue-500/30">
                    <h2 className="text-white font-bold text-base leading-tight">
                      {c.name}
                    </h2>
                    <p className="text-blue-200 text-xs mt-0.5">
                      📍 {c.location}
                    </p>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {METRICS.map((metric, idx) => {
                const betterIdx =
                  "better" in metric
                    ? getBetterIndex(compared, metric.key, metric.better as "higher" | "lower")
                    : -1;

                return (
                  <div
                    key={metric.key}
                    className={`grid grid-cols-3 border-b border-gray-100 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <div className="p-4 text-sm font-medium text-gray-500">
                      {metric.label}
                    </div>
                    {compared.map((c, colIdx) => {
                      const value = c[metric.key];
                      const isBetter = betterIdx === colIdx;

                      const display =
                        metric.key === "fees"
                          ? `₹${(value as number).toLocaleString("en-IN")} / yr`
                          : metric.key === "rating"
                          ? String(value)
                          : String(value);

                      return (
                        <div
                          key={c.id}
                          className={`p-4 border-l border-gray-100 text-sm ${
                            isBetter
                              ? "text-green-700 font-semibold"
                              : "text-gray-800"
                          }`}
                        >
                          {isBetter && (
                            <span className="inline-block mr-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                              ✓ Better
                            </span>
                          )}
                          <span className="break-words">{display}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {compared.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">⚖️</div>
              <p className="text-lg font-medium text-gray-600">
                Select two colleges above and click Compare
              </p>
              <p className="text-sm mt-1">
                Metrics with a green &quot;✓ Better&quot; badge indicate the stronger option.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}