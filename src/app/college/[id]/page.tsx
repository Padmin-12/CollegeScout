async function getCollege(id: string) {
  const res = await fetch(
    `http://localhost:3000/api/colleges/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch college");
  }

  return res.json();
}

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  const college = await getCollege(
    resolvedParams.id
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">

        {/* HERO */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-10 text-white mb-8">
          <h1 className="text-5xl font-bold mb-4">
            {college.name}
          </h1>

          <p className="text-lg">
            📍 {college.location}
          </p>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-gray-500 mb-2">
              Fees
            </h2>

            <p className="text-2xl font-bold text-black">
              ₹{college.fees}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-gray-500 mb-2">
              Rating
            </h2>

            <p className="text-2xl font-bold text-black">
              ⭐ {college.rating}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-gray-500 mb-2">
              Placements
            </h2>

            <p className="text-2xl font-bold text-black">
              {college.placements}
            </p>
          </div>
        </div>

        {/* OVERVIEW */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-black">
            Overview
          </h2>

          <p className="text-gray-700 leading-7">
            {college.description}
          </p>
        </div>

        {/* COURSES */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-black">
            Courses Offered
          </h2>

          <p className="text-gray-700">
            {college.courses}
          </p>
        </div>

        {/* PLACEMENT INSIGHTS */}
<div className="bg-white rounded-xl shadow-md p-8 mb-8">
  <h2 className="text-3xl font-bold mb-6 text-black">
    Placement Insights
  </h2>

  <div className="space-y-4 text-gray-700">
    <p>
      💼 <span className="font-semibold">Highest Package:</span>{" "}
      {college.highestPackage}
    </p>

    <p>
      🏢 <span className="font-semibold">Top Recruiters:</span>{" "}
      {college.topRecruiters}
    </p>
  </div>
</div>

{/* CAMPUS FACILITIES */}
<div className="bg-white rounded-xl shadow-md p-8 mb-8">
  <h2 className="text-3xl font-bold mb-6 text-black">
    Campus Facilities
  </h2>

  <p className="text-gray-700">
    {college.facilities}
  </p>
</div>

{/* ADMISSION INSIGHT */}
<div className="bg-white rounded-xl shadow-md p-8">
  <h2 className="text-3xl font-bold mb-6 text-black">
    Admission Insight
  </h2>

  <p className="text-gray-700">
    🎯 {college.examCutoff}
  </p>
</div>

      </div>
    </main>
  );
}