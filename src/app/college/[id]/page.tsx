async function getCollege(id: string) {
  const res = await fetch(
    `http://localhost:3000/api/colleges/${id}`,
    {
      cache: "no-store",
    }
  );

  return res.json();
}

export default async function CollegeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const college = await getCollege(params.id);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-black">
          {college.name}
        </h1>

        <p className="text-lg text-gray-600 mb-2">
          📍 {college.location}
        </p>

        <p className="mb-2 text-black">
          💰 Fees: ₹{college.fees}
        </p>

        <p className="mb-2 text-black">
          ⭐ Rating: {college.rating}
        </p>

        <p className="mb-2 text-black">
          📈 Placements: {college.placements}
        </p>

        <p className="mt-4 text-gray-700">
          {college.description}
        </p>

        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-2 text-black">
            Courses
          </h2>

          <p className="text-gray-700">
            {college.courses}
          </p>
        </div>
      </div>
    </main>
  );
}