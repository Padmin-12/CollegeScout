"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <nav style={{
      background: "#fff",
      borderBottom: "1px solid #DDDDDD",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#FF385C",
          letterSpacing: "-0.03em",
        }}>
          CollegeScout
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }} className="nav-desktop">
          <NavLink href="/">Colleges</NavLink>
          <NavLink href="/compare">Compare</NavLink>
          <NavLink href="/predictor">Predictor</NavLink>
          <NavLink href="/shortlist">★ Shortlist</NavLink>

          {session?.user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "4px" }}>
              <span
                style={{
                  fontSize: "13px",
                  color: "#717171",
                  maxWidth: "140px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={session.user.email ?? session.user.name ?? ""}
              >
                {session.user.name || session.user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "1px solid #DDDDDD",
                  background: "#fff",
                  color: "#222222",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FF385C";
                  e.currentTarget.style.color = "#FF385C";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#DDDDDD";
                  e.currentTarget.style.color = "#222222";
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                background: "#FF385C",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
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
            color: "#222222",
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
          borderTop: "1px solid #DDDDDD",
          padding: "12px 24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}>
          {[
            { href: "/", label: "Colleges" },
            { href: "/compare", label: "Compare" },
            { href: "/predictor", label: "Predictor" },
            { href: "/shortlist", label: "★ Shortlist" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "15px",
                color: "#222222",
                fontWeight: 500,
              }}
            >
              {item.label}
            </Link>
          ))}

          {session?.user ? (
            <div style={{ borderTop: "1px solid #EEEEEE", paddingTop: "12px", marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "#717171", paddingLeft: "12px" }}>
                {session.user.name || session.user.email}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "1px solid #DDDDDD",
                  background: "#fff",
                  color: "#222222",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                marginTop: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#FF385C",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          )}
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
        color: "#222222",
        textDecoration: "none",
        transition: "color 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#FF385C")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#222222")}
    >
      {children}
    </Link>
  );
}