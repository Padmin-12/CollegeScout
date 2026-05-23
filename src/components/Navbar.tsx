export default function Navbar() {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-blue-600">
        CollegeScout
      </h1>

      <div className="flex gap-6 text-gray-700 font-medium">
        <button>Colleges</button>
        <button>Compare</button>
        <button>Saved</button>
      </div>
    </nav>
  );
}