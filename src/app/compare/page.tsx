"use client";

import { useEffect, useState } from "react";

type College = {
  id: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  placements: string;
};

export default function ComparePage() {
  const [allColleges, setAllColleges] = useState<College[]>([]);

  const [college1, setCollege1] = useState("");
  const [college2, setCollege2] = useState("");

  const [comparedColleges, setComparedColleges] = useState<College[]>([]);

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

    console.log(data);

    setComparedColleges(data);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-8 text-black">
        Compare Colleges
      </h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <select
          value={college1}
          onChange={(e) => setCollege1(e.target.value)}
          className="p-3 rounded-lg border bg-white text-black"
        >
          <option value="">Select First College</option>

          {allColleges.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name}
            </option>
          ))}
         
        </select>

        <select
          value={college2}
          onChange={(e) => setCollege2(e.target.value)}
          className="p-3 rounded-lg border bg-white text-black"
        >
          <option value="">Select Second College</option>

           {allColleges.filter((college) => college.id !== college1).map((college) => (
            <option key={college.id} value={college.id}>
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

      {comparedColleges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {comparedColleges.map((college) => (
            <div
              key={college.id}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-2xl font-bold mb-4 text-black">
                {college.name}
              </h2>

              <p className="mb-2 text-gray-700">
                📍 {college.location}
              </p>

              <p className="mb-2 text-black">
                💰 Fees: ₹{college.fees}
              </p>

              <p className="mb-2 text-black">
                ⭐ Rating: {college.rating}
              </p>

              <p className="text-black">
                📈 Placements: {college.placements}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}