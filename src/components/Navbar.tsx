"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* LOGO */}
        <Link href="/">
          <h1 className="text-2xl font-bold text-blue-600 cursor-pointer tracking-tight">
            CollegeScout
          </h1>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
          <Link href="/" className="hover:text-blue-600 transition">
            Colleges
          </Link>
          <Link href="/compare" className="hover:text-blue-600 transition">
            Compare
          </Link>
          <Link href="/predictor" className="hover:text-blue-600 transition">
            Predictor
          </Link>
          {session && (
            <Link
              href="/saved"
              className="hover:text-blue-600 transition flex items-center gap-1"
            >
              ★ Saved
            </Link>
          )}

          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* MOBILE HAMBURGER */}
        <button
          className="md:hidden text-gray-700 hover:text-blue-600 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden mt-3 pb-3 border-t border-gray-100 space-y-1 pt-3 px-2">
          <Link
            href="/"
            className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            Colleges
          </Link>
          <Link
            href="/compare"
            className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            Compare
          </Link>
          <Link
            href="/predictor"
            className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            Predictor
          </Link>
          {session && (
            <Link
              href="/saved"
              className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              onClick={() => setMenuOpen(false)}
            >
              ★ Saved
            </Link>
          )}
          <div className="pt-2 border-t border-gray-100 mt-2">
            {session ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Sign Out ({session.user?.email})
              </button>
            ) : (
              <Link
                href="/login"
                className="block px-3 py-2 bg-blue-600 text-white rounded-lg text-center"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}