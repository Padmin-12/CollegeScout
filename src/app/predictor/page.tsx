"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
type PredictionResult = {
  name: string;
  location: string;
  rating: number;
};

export default function PredictorPage() {
  const [exam, setExam] = useState("JEE");
  const [rank, setRank] = useState("");

  const [results, setResults] = useState<
    PredictionResult[]
  >([]);

  function handlePredict() {
    const numericRank = Number(rank);

    let recommended: PredictionResult[] = [];

    if (numericRank <= 500) {
      recommended = [
        {
          name: "IIT Bombay",
          location: "Mumbai",
          rating: 4.9,
        },
      ];
    } else if (numericRank <= 2000) {
      recommended = [
        {
          name: "VJTI Mumbai",
          location: "Mumbai",
          rating: 4.5,
        },
        {
          name: "COEP Pune",
          location: "Pune",
          rating: 4.4,
        },
      ];
    } else {
      recommended = [
        {
          name: "PICT Pune",
          location: "Pune",
          rating: 4.1,
        },
      ];
    }

    setResults(recommended);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8">
        
        <h1 className="text-4xl font-bold mb-8 text-black text-center">
          College Predictor
        </h1>

        <div className="space-y-6">
          
          {/* EXAM */}
          <div>
            <label className="block mb-2 font-medium text-black">
              Select Exam
            </label>

            <select
              value={exam}
              onChange={(e) =>
                setExam(e.target.value)
              }
              className="w-full p-3 rounded-lg border bg-white text-black"
            >
              <option>JEE</option>
              <option>MHT-CET</option>
            </select>
          </div>

          {/* RANK */}
          <div>
            <label className="block mb-2 font-medium text-black">
              Enter Rank
            </label>

            <input
              type="number"
              placeholder="Enter your rank"
              value={rank}
              onChange={(e) =>
                setRank(e.target.value)
              }
              className="w-full p-3 rounded-lg border bg-white text-black"
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={handlePredict}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold"
          >
            Predict Colleges
          </button>
        </div>

        {/* RESULTS */}
        {results.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6 text-black">
              Recommended Colleges
            </h2>

            <div className="space-y-4">
              {results.map((college) => (
                <div
                  key={college.name}
                  className="border rounded-xl p-5 bg-gray-50"
                >
                  <h3 className="text-xl font-semibold text-black">
                    {college.name}
                  </h3>

                  <p className="text-gray-600">
                    📍 {college.location}
                  </p>

                  <p className="text-black mt-2">
                    ⭐ Rating: {college.rating}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}