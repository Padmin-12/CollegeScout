import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">

      <Link href="/">
        <h1 className="text-3xl font-bold text-blue-600 cursor-pointer">
          CollegeScout
        </h1>
      </Link>

      <div className="flex gap-6 text-gray-700 font-medium">

        <Link href="/">
          <button className="hover:text-blue-600 transition">
            Colleges
          </button>
        </Link>

        <Link href="/compare">
          <button className="hover:text-blue-600 transition">
            Compare
          </button>
        </Link>

        <Link href="/predictor">
          <button className="hover:text-blue-600 transition">
            Predictor
          </button>
        </Link>

      </div>
    </nav>
  );
}