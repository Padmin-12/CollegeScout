"use client";

import { useEffect, useState } from "react";
import {
  getGuestShortlist,
  addToGuestShortlist,
  removeFromGuestShortlist,
  isInGuestShortlist,
  dispatchShortlistChange,
} from "@/lib/guestShortlist";

type Props = {
  collegeId: string;
  variant?: "primary" | "secondary";
};

export default function ShortlistButton({ collegeId, variant = "secondary" }: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync from localStorage on mount and when other components change the list
  useEffect(() => {
    setSaved(isInGuestShortlist(collegeId));

    const handler = () => setSaved(isInGuestShortlist(collegeId));
    window.addEventListener("guest-shortlist-change", handler);
    return () => window.removeEventListener("guest-shortlist-change", handler);
  }, [collegeId]);

  function toggle() {
    setLoading(true);
    if (saved) {
      removeFromGuestShortlist(collegeId);
      setSaved(false);
    } else {
      addToGuestShortlist(collegeId);
      setSaved(true);
    }
    dispatchShortlistChange();
    setLoading(false);
  }

  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      style={{
        padding: "9px 18px",
        border: isPrimary ? "none" : "1.5px solid #DDDDDD",
        background: saved ? "#FFF1F2" : isPrimary ? "#FF385C" : "#fff",
        color: saved ? "#FF385C" : isPrimary ? "#fff" : "#717171",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
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
  );
}
