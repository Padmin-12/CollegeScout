"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Props = {
  onClose: () => void;
};

export default function AuthModal({ onClose }: Props) {
  const pathname = usePathname();

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.45)",
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
        background: "#fff",
        borderRadius: "20px",
        padding: "36px 32px",
        width: "min(440px, calc(100vw - 32px))",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        animation: "slideUp 0.2s ease",
        textAlign: "center",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: "16px", right: "16px",
            background: "#F7F7F7", border: "none", borderRadius: "50%",
            width: "32px", height: "32px",
            fontSize: "16px", cursor: "pointer", color: "#717171",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#EEEEEE")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#F7F7F7")}
        >
          ×
        </button>

        {/* Icon */}
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>★</div>

        <h2 style={{
          fontSize: "1.3rem", fontWeight: 700, color: "#222222",
          letterSpacing: "-0.02em", marginBottom: "10px",
        }}>
          Sign in to shortlist
        </h2>

        <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6, marginBottom: "24px" }}>
          Save colleges to your personal shortlist — access them from any device, compare side-by-side, and never lose track.
        </p>

        {/* Benefits */}
        <div style={{
          background: "#F7F7F7", borderRadius: "12px",
          padding: "14px 18px", marginBottom: "24px",
          display: "flex", flexDirection: "column", gap: "8px", textAlign: "left",
        }}>
          {[
            "Shortlist synced across devices",
            "One-click compare shortlisted colleges",
            "Free — no spam, no calls",
          ].map((b) => (
            <div key={b} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#222222" }}>
              <span style={{ color: "#FF385C", fontWeight: 700 }}>✓</span>
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
          style={{
            display: "block", padding: "13px",
            background: "#FF385C", color: "#fff",
            borderRadius: "12px", fontSize: "15px", fontWeight: 600,
            textDecoration: "none", marginBottom: "10px",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E31C5F")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FF385C")}
        >
          Sign In
        </Link>

        <Link
          href={`/login?tab=register&callbackUrl=${encodeURIComponent(pathname)}`}
          style={{
            display: "block", padding: "12px",
            background: "#fff", color: "#222222",
            borderRadius: "12px", fontSize: "14px", fontWeight: 500,
            textDecoration: "none", border: "1.5px solid #DDDDDD",
            transition: "border-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#222222")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#DDDDDD")}
        >
          Create free account
        </Link>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
