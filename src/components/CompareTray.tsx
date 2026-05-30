"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ShortlistedCollege = { id: string; slug: string; name: string };

type Props = {
  shortlisted: ShortlistedCollege[];
};

export default function CompareTray({ shortlisted }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shortlisted.length >= 2 && !dismissed) {
      // small delay so it slides in after page settles
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [shortlisted.length, dismissed]);

  // Re-show tray if new college shortlisted after dismissal
  useEffect(() => {
    if (shortlisted.length >= 2) setDismissed(false);
  }, [shortlisted.length]);

  if (shortlisted.length < 2 || dismissed) return null;

  const compareUrl = `/compare?ids=${shortlisted.map((c) => c.slug).join(",")}`;

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "#222222",
          color: "#fff",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Left: colleges */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", color: "#AAAAAA", whiteSpace: "nowrap" }}>
            {shortlisted.length} selected:
          </span>
          {shortlisted.slice(0, 3).map((c) => (
            <span
              key={c.id}
              style={{
                padding: "5px 12px",
                background: "rgba(255,255,255,0.12)",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 500,
                whiteSpace: "nowrap",
                maxWidth: "180px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.name}
            </span>
          ))}
          {shortlisted.length > 3 && (
            <span style={{ fontSize: "13px", color: "#AAAAAA" }}>
              +{shortlisted.length - 3} more
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <Link
            href={compareUrl}
            style={{
              padding: "10px 22px",
              background: "#FF385C",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E31C5F")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FF385C")}
          >
            Compare Now →
          </Link>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss compare tray"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              fontSize: "18px",
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          >
            ×
          </button>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind tray */}
      {visible && <div style={{ height: "68px" }} />}
    </>
  );
}
