"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import CollegeCard from "@/components/CollegeCard";

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

      <section className="p-6">
        <h2 className="text-3xl font-bold mb-6 text-black">
          Discover Top Colleges
        </h2>
        
        <input
          type="text"
          placeholder="Search colleges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300 mb-6 bg-white text-black"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colleges.map((college) => (
            <CollegeCard
              id={college.id}
              key={college.id}
              name={college.name}
              location={college.location}
              fees={college.fees}
              rating={college.rating}
              placements={college.placements}
            />
          ))}
        </div>
      </section>
    </main>
  );
}