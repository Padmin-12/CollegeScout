"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import CollegeCard from "@/components/CollegeCard";
import Link from "next/link";

type College = {
  id: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  placements: string;
};

export default function Home() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchColleges() {
      try {
        const response = await fetch(
          `/api/colleges?search=${search}`
        );

        const data = await response.json();

        setColleges(data);
      } catch (error) {
        console.error("Failed to fetch colleges");
      }
    }

    fetchColleges();
  }, [search]);

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      {/* HERO SECTION */}
<section className="px-6 py-24 text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white">      
<h1 className="text-5xl md:text-6xl font-bold mb-6">         
   Discover Your Ideal College
        </h1>

        <p className="text-xl text-blue-100">
          Search, compare, and evaluate colleges
          based on fees, placements, ratings, and
          more.
        </p>

        <div className="max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search colleges..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full p-4 rounded-xl border border-gray-300 bg-white text-black shadow-sm"
          />
        </div>
      </section>

      {/* FEATURED COLLEGES */}
      <section className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-black">
            Featured Colleges
          </h2>

          <Link
            href="/compare"
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-3 rounded-lg"
          >
            Compare Colleges
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {colleges.length > 0 ? (
  colleges.map((college) => (
    <CollegeCard
      key={college.id}
      id={college.id}
      name={college.name}
      location={college.location}
      fees={college.fees}
      rating={college.rating}
      placements={college.placements}
    />
  ))
) : (
  <div className="col-span-full bg-white p-10 rounded-2xl text-center shadow-md">
    <h2 className="text-2xl font-bold text-black mb-2">
      No colleges found
    </h2>

    <p className="text-gray-600">
      Try searching with different keywords.
    </p>
  </div>
)}
</div>
      </section>

      {/* PREDICTOR CTA */}
      <section className="p-6">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 rounded-2xl p-10 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Predict Colleges Based on Your Rank
          </h2>

          <p className="text-lg mb-6">
            Get personalized college recommendations
            instantly.
          </p>

          <Link
            href="/predictor"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold"
          >
            Try Predictor
          </Link>
        </div>
      </section>
    </main>
  );
}