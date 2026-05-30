"use client";

import { useState, useEffect } from "react";

type Step = 1 | 2 | 3;

const STREAMS = ["Engineering", "Medical", "Commerce", "Law", "Sciences", "Management"];
const EXAMS   = ["JEE Main", "JEE Advanced", "CUET", "MHT-CET", "KCET", "WBJEE", "BITSAT", "Other"];

type Prefs = {
  stream: string;
  exam: string;
  placement: number;
  fees: number;
  location: number;
};

type Props = {
  onComplete: (prefs: Prefs) => void;
  onSkip: () => void;
};

export default function OnboardingModal({ onComplete, onSkip }: Props) {
  const [step, setStep]           = useState<Step>(1);
  const [stream, setStream]       = useState("");
  const [exam, setExam]           = useState("");
  const [placement, setPlacement] = useState(60);
  const [fees, setFees]           = useState(30);
  const [location, setLocation]   = useState(10);

  // Keep sliders summing to 100 (roughly)
  function adjustWeights(field: "placement" | "fees" | "location", val: number) {
    if (field === "placement") {
      setPlacement(val);
      const rest = 100 - val;
      setFees(Math.round(rest * (fees / (fees + location || 1))));
      setLocation(100 - val - Math.round(rest * (fees / (fees + location || 1))));
    } else if (field === "fees") {
      setFees(val);
      const rest = 100 - val;
      setPlacement(Math.round(rest * (placement / (placement + location || 1))));
      setLocation(100 - val - Math.round(rest * (placement / (placement + location || 1))));
    } else {
      setLocation(val);
      const rest = 100 - val;
      setPlacement(Math.round(rest * (placement / (placement + fees || 1))));
      setFees(100 - val - Math.round(rest * (placement / (placement + fees || 1))));
    }
  }

  // Block scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleComplete() {
    onComplete({ stream, exam, placement, fees, location });
  }

  const progress = ((step - 1) / 3) * 100;

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.5)",
        animation: "fadeIn 0.2s ease",
      }} />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 1000,
        background: "#fff",
        borderRadius: "20px",
        width: "min(500px, calc(100vw - 32px))",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        animation: "slideUp 0.25s ease",
      }}>
        {/* Progress bar */}
        <div style={{ height: "4px", background: "#F7F7F7", borderRadius: "4px 4px 0 0", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "#FF385C",
            transition: "width 0.4s ease",
          }} />
        </div>

        <div style={{ padding: "32px 28px" }}>
          {/* Step indicator */}
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#AAAAAA", letterSpacing: "0.05em", marginBottom: "8px" }}>
            STEP {step} OF 3
          </p>

          {/* ── STEP 1: Stream ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#222222", marginBottom: "8px" }}>
                What are you interested in?
              </h2>
              <p style={{ fontSize: "14px", color: "#717171", marginBottom: "24px" }}>
                We'll show you the most relevant colleges first.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px" }}>
                {STREAMS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStream(s)}
                    style={{
                      padding: "9px 18px",
                      borderRadius: "999px",
                      border: `1.5px solid ${stream === s ? "#FF385C" : "#DDDDDD"}`,
                      background: stream === s ? "#FF385C" : "#fff",
                      color: stream === s ? "#fff" : "#222222",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 2: Exam ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#222222", marginBottom: "8px" }}>
                Which exam are you appearing for?
              </h2>
              <p style={{ fontSize: "14px", color: "#717171", marginBottom: "24px" }}>
                We'll highlight colleges with cutoff data for your exam.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px" }}>
                {EXAMS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setExam(e)}
                    style={{
                      padding: "9px 18px",
                      borderRadius: "999px",
                      border: `1.5px solid ${exam === e ? "#FF385C" : "#DDDDDD"}`,
                      background: exam === e ? "#FF385C" : "#fff",
                      color: exam === e ? "#fff" : "#222222",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 3: Priorities ── */}
          {step === 3 && (
            <>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#222222", marginBottom: "8px" }}>
                What matters most to you?
              </h2>
              <p style={{ fontSize: "14px", color: "#717171", marginBottom: "24px" }}>
                Drag the sliders — we'll rank colleges accordingly. Total: {placement + fees + location}%
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
                {[
                  { label: "Placement Package", val: placement, field: "placement" as const, color: "#FF385C" },
                  { label: "Low Fees", val: fees, field: "fees" as const, color: "#16A34A" },
                  { label: "City / Location", val: location, field: "location" as const, color: "#D97706" },
                ].map(({ label, val, field, color }) => (
                  <div key={field}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#222222" }}>{label}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color }}>{val}%</span>
                    </div>
                    <input
                      type="range" min={0} max={100} value={val}
                      onChange={(e) => adjustWeights(field, parseInt(e.target.value))}
                      style={{ width: "100%", accentColor: color, cursor: "pointer" }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                style={{
                  padding: "11px 20px",
                  border: "1.5px solid #DDDDDD",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 500,
                  background: "#fff",
                  color: "#222222",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                ← Back
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as Step)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#FF385C",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#E31C5F")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FF385C")}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#FF385C",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#E31C5F")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FF385C")}
              >
                Find my colleges ✓
              </button>
            )}
          </div>

          {/* Skip */}
          <button
            onClick={onSkip}
            style={{
              display: "block", width: "100%", marginTop: "14px",
              background: "none", border: "none",
              fontSize: "13px", color: "#AAAAAA", cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Skip for now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
