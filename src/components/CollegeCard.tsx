"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type CollegeCardProps = {
  id: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  placements: string;
  examCutoff?: string;
  highestPackage?: string;
  isSaved?: boolean;
  onSaveToggle?: (id: string, saved: boolean) => void;
};

export default function CollegeCard({
  id,
  name,
  location,
  fees,
  rating,
  placements,
  examCutoff,
  highestPackage,
  isSaved = false,
  onSaveToggle,
}: CollegeCardProps) {
  const router = useRouter();

  function handleCompare(e: React.MouseEvent) {
    e.preventDefault();
    router.push(`/compare?id=${id}`);
  }

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    onSaveToggle?.(id, !isSaved);
  }

  const ratingColor =
    rating >= 4.5
      ? "bg-green-100 text-green-700"
      : rating >= 4.0
      ? "bg-blue-100 text-blue-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <Link href={`/college/${id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-gray-200 h-full flex flex-col">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 relative">
          <h2 className="text-white text-xl font-bold leading-tight pr-10">
            {name}
          </h2>
          <p className="text-blue-200 text-sm mt-1">📍 {location}</p>

          {/* Save button */}
          {onSaveToggle && (
            <button
              onClick={handleSave}
              title={isSaved ? "Remove from shortlist" : "Add to shortlist"}
              className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isSaved
                  ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {isSaved ? "★" : "☆"}
            </button>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-center mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${ratingColor}`}>
              ⭐ {rating}
            </span>
            {examCutoff && (
              <span className="text-xs text-gray-500 truncate max-w-[140px]">
                🎯 {examCutoff.split(" ").slice(0, 3).join(" ")}
              </span>
            )}
          </div>

          <div className="space-y-2 text-gray-700 text-sm flex-1">
            <p>
              💰 <span className="font-semibold">Fees:</span>{" "}
              ₹{fees.toLocaleString("en-IN")} / year
            </p>
            <p>
              📈 <span className="font-semibold">Placements:</span> {placements}
            </p>
            {highestPackage && (
              <p>
                🏆 <span className="font-semibold">Highest:</span> {highestPackage}
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <span className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm text-center font-medium hover:bg-blue-700 transition">
              View Details
            </span>

            <button
              onClick={handleCompare}
              className="border border-gray-300 px-3 py-2 rounded-lg text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600 transition"
            >
              Compare
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}