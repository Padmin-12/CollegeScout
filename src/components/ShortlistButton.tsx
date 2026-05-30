"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";

type Props = {
  collegeId: string;
  variant?: "primary" | "secondary";
};

export default function ShortlistButton({ collegeId, variant = "secondary" }: Props) {
  const { data: session, status } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch current shortlist state (only when logged in)
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setLoading(false);
      return;
    }

    fetch("/api/shortlist")
      .then((r) => r.json())
      .then((data: Array<{ collegeId: string }>) => {
        if (Array.isArray(data)) {
          setSaved(data.some((e) => e.collegeId === collegeId));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [collegeId, session, status]);

  async function toggle() {
    // Not logged in — show inline modal instead of redirect
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      if (saved) {
        await fetch("/api/shortlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collegeId }),
        });
        setSaved(false);
      } else {
        await fetch("/api/shortlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
  const isLoadingAuth = status === "loading";

  return (
    <>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <button
        type="button"
        onClick={toggle}
        disabled={loading || isLoadingAuth}
        title={!session ? "Sign in to save to your shortlist" : undefined}
        style={{
          padding: "9px 18px",
          border: isPrimary ? "none" : "1.5px solid #DDDDDD",
          background: saved ? "#FFF1F2" : isPrimary ? "#FF385C" : "#fff",
          color: saved ? "#FF385C" : isPrimary ? "#fff" : "#717171",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: loading || isLoadingAuth ? "not-allowed" : "pointer",
          opacity: loading || isLoadingAuth ? 0.7 : 1,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!saved && !isPrimary) e.currentTarget.style.borderColor = "#222222";
        }}
        onMouseLeave={(e) => {
          if (!saved && !isPrimary) e.currentTarget.style.borderColor = "#DDDDDD";
        }}
      >
        {saved ? "★ Shortlisted" : "☆ Add to Shortlist"}
      </button>
    </>
  );
}
