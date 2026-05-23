import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  const college = await prisma.college.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!college) {
    notFound();
  }

  const ratingColor =
    college.rating >= 4.5
      ? "text-green-600"
      : college.rating >= 4.0
      ? "text-blue-600"
      : "text-yellow-600";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-5">
            <Link href="/" className="hover:text-blue-600 transition">
              Colleges
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-800">{college.name}</span>
          </nav>

          {/* HERO */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 sm:p-10 text-white mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {college.name}
              </h1>
              <p className="text-blue-200 text-sm sm:text-base mb-4">
                📍 {college.location}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/compare?id=${college.id}`}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  ⚖️ Compare
                </Link>
                <Link
                  href="/"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  ← Back
                </Link>
              </div>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Annual Fees
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{college.fees.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">per year</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Rating
              </p>
              <p className={`text-2xl font-bold ${ratingColor}`}>
                ⭐ {college.rating} / 5
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Avg Placements
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {college.placements}
              </p>
            </div>
          </div>

          {/* OVERVIEW */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-5">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Overview</h2>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              {college.description}
            </p>
          </div>

          {/* COURSES + PLACEMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                📚 Courses Offered
              </h2>
              <div className="flex flex-wrap gap-2">
                {college.courses.split(",").map((c) => (
                  <span
                    key={c}
                    className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full font-medium"
                  >
                    {c.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                🎯 Admission Insight
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {college.examCutoff}
              </p>
            </div>
          </div>

          {/* PLACEMENT INSIGHTS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📈 Placement Insights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Highest Package
                </p>
                <p className="text-lg font-bold text-green-700">
                  {college.highestPackage}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Avg Package
                </p>
                <p className="text-lg font-bold text-blue-700">
                  {college.placements}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Top Recruiters
              </p>
              <div className="flex flex-wrap gap-2">
                {college.topRecruiters.split(",").map((r) => (
                  <span
                    key={r}
                    className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full"
                  >
                    {r.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* FACILITIES */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🏛️ Campus Facilities
            </h2>
            <div className="flex flex-wrap gap-2">
              {college.facilities.split(",").map((f) => (
                <span
                  key={f}
                  className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-medium"
                >
                  {f.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}