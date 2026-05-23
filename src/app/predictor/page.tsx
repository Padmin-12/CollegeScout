"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type PredictedCollege = {
  id: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  placements: string;
  highestPackage: string;
  examCutoff: string;
  courses: string;
};

const EXAMS = [
  { value: "JEE Advanced", label: "JEE Advanced" },
  { value: "JEE Mains", label: "JEE Mains" },
  { value: "MHT-CET", label: "MHT-CET" },
  { value: "KCET", label: "KCET" },
  { value: "WBJEE", label: "WBJEE" },
  { value: "BITSAT", label: "BITSAT (Score)" },
];

const BRANCHES = [
  "CS", "ECE", "Mechanical", "Electrical", "Civil", "Chemical",
];

export default function PredictorPage() {
  const [exam, setExam] = useState("JEE Mains");
  const [rank, setRank] = useState("");
  const [branch, setBranch] = useState("");
  const [results, setResults] = useState<PredictedCollege[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const isScore = exam === "BITSAT";

  async function handlePredict() {
    if (!rank) return;
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = new URLSearchParams({ exam, rank });
      if (branch) params.set("branch", branch);
      const res = await fetch(`/api/predictor?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not fetch predictions. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              College Rank Predictor
            </h1>
            <p className="text-gray-500 text-sm">
              Enter your exam and rank to discover which colleges you're likely eligible for.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="space-y-5">
              {/* Exam */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Entrance Exam
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EXAMS.map((e) => (
                    <button
                      key={e.value}
                      onClick={() => setExam(e.value)}
                      className={`py-2 px-3 rounded-xl border text-sm font-medium transition ${
                        exam === e.value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rank / Score */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {isScore ? "Your Score" : "Your Rank"}
                </label>
                <input
                  type="number"
                  placeholder={
                    isScore
                      ? "Enter your BITSAT score (e.g. 380)"
                      : "Enter your rank (e.g. 5000)"
                  }
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm"
                  min={1}
                />
                {isScore && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    For BITSAT, a higher score means better eligibility (max 450).
                  </p>
                )}
              </div>

              {/* Branch (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Branch{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setBranch("")}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${
                      !branch
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    Any
                  </button>
                  {BRANCHES.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBranch(branch === b ? "" : b)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        branch === b
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePredict}
                disabled={!rank || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition"
              >
                {loading ? "Fetching predictions..." : "Predict My Colleges"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {searched && !loading && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {results.length > 0
                  ? `${results.length} Eligible College${results.length > 1 ? "s" : ""} Found`
                  : "No colleges found"}
              </h2>
              <p className="text-gray-500 text-sm mb-5">
                {results.length > 0
                  ? `Based on ${exam} ${isScore ? "score" : "rank"} ${rank}${branch ? ` with ${branch} preference` : ""}`
                  : `No colleges matched your ${exam} ${isScore ? "score" : "rank"} of ${rank}. Try a different exam or rank.`}
              </p>

              <div className="space-y-4">
                {results.map((college) => (
                  <div
                    key={college.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">
                            {college.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            📍 {college.location}
                          </p>
                        </div>
                        <span
                          className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            college.rating >= 4.5
                              ? "bg-green-100 text-green-700"
                              : college.rating >= 4.0
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          ⭐ {college.rating}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                        <span>💰 ₹{college.fees.toLocaleString("en-IN")} / yr</span>
                        <span>📈 {college.placements}</span>
                        <span>🏆 {college.highestPackage}</span>
                      </div>

                      <p className="mt-2 text-xs text-gray-400">
                        🎯 Cutoff: {college.examCutoff}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        href={`/college/${college.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        View
                      </Link>
                      <Link
                        href={`/compare?id=${college.id}`}
                        className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition"
                      >
                        Compare
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}