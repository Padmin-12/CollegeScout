type CollegeCardProps = {
  name: string;
  location: string;
  fees: number;
  rating: number;
  placements: string;
};

export default function CollegeCard({
  name,
  location,
  fees,
  rating,
  placements,
}: CollegeCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <h3 className="text-2xl font-semibold mb-2">
        {name}
      </h3>

      <p className="text-gray-600">
        📍 {location}
      </p>

      <p className="mt-2">
        💰 Fees: ₹{fees}
      </p>

      <p>
        ⭐ Rating: {rating}
      </p>

      <p>
        📈 Placements: {placements}
      </p>
    </div>
  );
}