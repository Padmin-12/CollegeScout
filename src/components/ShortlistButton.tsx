"use client";

import { useEffect, useState } from "react";

function getSessionId(): string {
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}

type Props = {
  collegeId: string;
  variant?: "primary" | "secondary";
};

export default function ShortlistButton({ collegeId, variant = "secondary" }: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = getSessionId();
    fetch("/api/shortlist", { headers: { "x-session-id": sessionId } })
      .then((r) => r.json())
      .then((data: Array<{ collegeId: string }>) => {
        if (Array.isArray(data)) {
          setSaved(data.some((e) => e.collegeId === collegeId));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [collegeId]);

  async function toggle() {
    const sessionId = getSessionId();
    setLoading(true);
    try {
      if (saved) {
        await fetch("/api/shortlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "x-session-id": sessionId },
          body: JSON.stringify({ collegeId }),
        });
        setSaved(false);
      } else {
        await fetch("/api/shortlist", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-session-id": sessionId },
          body: JSON.stringify({ collegeId }),
        });
        setSaved(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      style={{
        padding: "9px 18px",
        border: isPrimary ? "none" : "1.5px solid #E5E7EB",
        background: saved ? "#FFFBEB" : isPrimary ? "#006AFF" : "#fff",
        color: saved ? "#D97706" : isPrimary ? "#fff" : "#374151",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {saved ? "★ Shortlisted" : "☆ Add to Shortlist"}
    </button>
  );
}
