"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
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
  const { status } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync state on mount, status change, or when other components change the list
  useEffect(() => {
    let isMounted = true;

    if (status === "authenticated") {
      fetch("/api/shortlist")
        .then((res) => (res.ok ? res.json() : []))
        .then((list: { collegeId: string }[]) => {
          if (isMounted && Array.isArray(list)) {
            setSaved(list.some((item) => item.collegeId === collegeId));
          }
        })
        .catch(() => {});
    } else {
      Promise.resolve().then(() => {
        if (isMounted) {
          setSaved(isInGuestShortlist(collegeId));
        }
      });
    }

    const handler = () => {
      if (status === "authenticated") {
        fetch("/api/shortlist")
          .then((res) => (res.ok ? res.json() : []))
          .then((list: { collegeId: string }[]) => {
            if (isMounted && Array.isArray(list)) {
              setSaved(list.some((item) => item.collegeId === collegeId));
            }
          })
          .catch(() => {});
      } else {
        setSaved(isInGuestShortlist(collegeId));
      }
    };

    window.addEventListener("guest-shortlist-change", handler);
    return () => {
      isMounted = false;
      window.removeEventListener("guest-shortlist-change", handler);
    };
  }, [collegeId, status]);

  async function toggle() {
    setLoading(true);
    try {
      if (status === "authenticated") {
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
      } else {
        if (saved) {
          removeFromGuestShortlist(collegeId);
          setSaved(false);
        } else {
          addToGuestShortlist(collegeId);
          setSaved(true);
        }
      }
      dispatchShortlistChange();
    } catch (err) {
      console.error("Failed to toggle shortlist", err);
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
