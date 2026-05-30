"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
};

export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles: Record<string, React.CSSProperties> = {
    success: { background: "#222222", color: "#fff" },
    error:   { background: "#FF385C", color: "#fff" },
    info:    { background: "#222222", color: "#fff" },
  };

  const icons = {
    success: "✓",
    error:   "✕",
    info:    "ℹ",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 20px",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        fontSize: "14px",
        fontWeight: 500,
        maxWidth: "360px",
        animation: "toastIn 0.2s ease",
        ...styles[type],
      }}
    >
      <span style={{ fontWeight: 700, fontSize: "16px" }}>{icons[type]}</span>
      <p style={{ flex: 1, margin: 0 }}>{message}</p>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          opacity: 0.7,
          cursor: "pointer",
          fontSize: "16px",
          padding: "0 0 0 4px",
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
      >
        ✕
      </button>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
