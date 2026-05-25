"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      background: "#fff",
      borderBottom: "1px solid #E5E7EB",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 24px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#006AFF",
          letterSpacing: "-0.02em",
        }}>
          CollegeScout
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }} className="nav-desktop">
          <NavLink href="/">Colleges</NavLink>
          <NavLink href="/compare">Compare</NavLink>
          <NavLink href="/predictor">Predictor</NavLink>
          {session && <NavLink href="/saved">★ Saved</NavLink>}

          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#6B7280" }}>
                {session.user?.name ?? session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  padding: "6px 14px",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#374151",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/login" style={{
              padding: "7px 16px",
              background: "#006AFF",
              color: "#fff",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}>
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          className="nav-mobile-toggle"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "#374151",
          }}
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          borderTop: "1px solid #E5E7EB",
          padding: "12px 24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}>
          {[
            { href: "/", label: "Colleges" },
            { href: "/compare", label: "Compare" },
            { href: "/predictor", label: "Predictor" },
            ...(session ? [{ href: "/saved", label: "★ Saved" }] : []),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: "10px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#374151",
                fontWeight: 500,
              }}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid #E5E7EB", marginTop: "8px", paddingTop: "12px" }}>
            {session ? (
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#374151",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "10px",
                  background: "#006AFF",
                  color: "#fff",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Responsive: show hamburger on mobile, hide desktop nav */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: "14px",
        fontWeight: 500,
        color: "#374151",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#006AFF")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#374151")}
    >
      {children}
    </Link>
  );
}