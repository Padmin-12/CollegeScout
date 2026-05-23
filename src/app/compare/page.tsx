"use client";

import { useEffect, useState } from "react";
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
};

export default function ComparePage() {
  const [allColleges, setAllColleges] = useState<College[]>([]);

  const [college1, setCollege1] = useState("");
  const [college2, setCollege2] = useState("");

  const [comparedColleges, setComparedColleges] =
    useState<College[]>([]);

  useEffect(() => {
    async function fetchColleges() {
      const res = await fetch("/api/colleges");

      const data = await res.json();

      setAllColleges(data);
    }

    fetchColleges();
  }, []);

  async function handleCompare() {
    if (!college1 || !college2) return;

    const res = await fetch(
      `/api/compare?id1=${college1}&id2=${college2}`
    );

    const data = await res.json();

    setComparedColleges(data);
  }

  return (
    <>
  <Navbar />
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-8 text-black">
        Compare Colleges
      </h1>

      {/* SELECTORS */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">

        <select
          value={college1}
          onChange={(e) => setCollege1(e.target.value)}
          className="p-3 rounded-lg border bg-white text-black"
        >
          <option value="">
            Select First College
          </option>

          {allColleges.map((college) => (
            <option
              key={college.id}
              value={college.id}
            >
              {college.name}
            </option>
          ))}
        </select>

        <select
          value={college2}
          onChange={(e) => setCollege2(e.target.value)}
          className="p-3 rounded-lg border bg-white text-black"
        >
          <option value="">
            Select Second College
          </option>

          {allColleges
            .filter(
              (college) =>
                college.id !== college1
            )
            .map((college) => (
              <option
                key={college.id}
                value={college.id}
              >
                {college.name}
              </option>
            ))}
        </select>

        <button
          onClick={handleCompare}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Compare
        </button>
      </div>

      {/* COMPARISON SECTION */}
      {comparedColleges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

          {comparedColleges.map((college) => (
            <div
              key={college.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden border"
            >

              {/* HEADER */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
                <h2 className="text-3xl font-bold text-white">
                  {college.name}
                </h2>

                <p className="text-white mt-2">
                  📍 {college.location}
                </p>
              </div>

              {/* DETAILS */}
              <div className="p-6 space-y-5">

                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium text-gray-600">
                    Fees
                  </span>

                  <span className="font-bold text-black">
                    ₹{college.fees}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium text-gray-600">
                    Rating
                  </span>

                  <span className="font-bold text-black">
                    ⭐ {college.rating}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-3">
                  <span className="font-medium text-gray-600">
                    Placements
                  </span>

                  <span className="font-bold text-black">
                    {college.placements}
                  </span>
                </div>

                <div className="border-b pb-3">
                  <p className="font-medium text-gray-600 mb-2">
                    Courses
                  </p>

                  <p className="text-black">
                    {college.courses}
                  </p>
                </div>

                <div className="border-b pb-3">
                  <p className="font-medium text-gray-600 mb-2">
                    Top Recruiters
                  </p>

                  <p className="text-black">
                    {college.topRecruiters}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-gray-600 mb-2">
                    Admission Insight
                  </p>

                  <p className="text-black">
                    🎯 {college.examCutoff}
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </main>
    </>
  );
}