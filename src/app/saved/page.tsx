"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Toast from "@/components/Toast";

type College = {
  id: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  placements: string;
  highestPackage: string;
  examCutoff: string;
};

export default function SavedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/saved");
      if (res.ok) {
        const data = await res.json();
        setColleges(data);
      }
    } catch {
      setToast({ message: "Failed to load saved colleges", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchSaved();
    }
  }, [status, router, fetchSaved]);

  async function handleUnsave(collegeId: string) {
    try {
      await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId }),
      });
      setColleges((prev) => prev.filter((c) => c.id !== collegeId));
      setToast({ message: "Removed from shortlist", type: "success" });
    } catch {
      setToast({ message: "Failed to remove college", type: "error" });
    }
  }

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Shortlist</h1>
              <p className="text-gray-500 mt-1">
                {colleges.length} college{colleges.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            {colleges.length >= 2 && (
              <Link
                href={`/compare?id=${colleges[0].id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Compare Saved
              </Link>
            )}
          </div>

          {colleges.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
              <div className="text-5xl mb-4">🔖</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                No colleges saved yet
              </h2>
              <p className="text-gray-500 mb-6">
                Use the ☆ button on any college card to build your shortlist.
              </p>
              <Link
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Browse Colleges
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {colleges.map((college) => (
                <div
                  key={college.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {college.name}
                        </h2>
                        <p className="text-sm text-gray-500">📍 {college.location}</p>
                      </div>
                      <span
                        className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
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

                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-gray-600">
                      <span>💰 ₹{college.fees.toLocaleString("en-IN")} / year</span>
                      <span>📈 {college.placements}</span>
                      <span>🏆 {college.highestPackage}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/college/${college.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      View
                    </Link>
                    <Link
                      href={`/compare?id=${college.id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition"
                    >
                      Compare
                    </Link>
                    <button
                      onClick={() => handleUnsave(college.id)}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition"
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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
