import Link from "next/link";

type CollegeCardProps = {
  id: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  placements: string;
};

export default function CollegeCard({
  id,
  name,
  location,
  fees,
  rating,
  placements,
}: CollegeCardProps) {
  return (
    <Link href={`/college/${id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition duration-300 cursor-pointer border border-gray-200">
        
   <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
  <h2 className="text-white text-3xl font-bold">
    {name}
  </h2>
</div>

        {/* CONTENT */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">
              📍 {location}
            </span>

            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              ⭐ {rating}
            </span>
          </div>

          <div className="space-y-3 text-gray-700">
            <p>
              💰 <span className="font-semibold">Fees:</span> ₹{fees}
            </p>

            <p>
              📈 <span className="font-semibold">Placements:</span>{" "}
              {placements}
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
              View Details
            </button>

            <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-black">
              Compare
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}