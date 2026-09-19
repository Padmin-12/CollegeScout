"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { migrateGuestShortlist } from "@/lib/guestShortlist";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #DDDDDD",
  borderRadius: "12px",
  fontSize: "14px",
  color: "#222222",
  background: "#fff",
  outline: "none",
  transition: "border-color 0.2s ease",
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const feature = searchParams.get("feature");

  const [tab, setTab] = useState<"login" | "register">(() =>
    searchParams.get("tab") === "register" ? "register" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      await migrateGuestShortlist();
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleDemoLogin() {
    setError("");
    setDemoLoading(true);

    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) {
        throw new Error("Could not access demo account.");
      }
      const { email: demoEmail, password: demoPassword } = await res.json();
      const result = await signIn("credentials", {
        email: demoEmail,
        password: demoPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("Demo login failed. Please try again.");
      } else {
        await migrateGuestShortlist();
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong with demo login. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setTab("login");
        setError("Account created! Please sign in.");
      } else {
        await migrateGuestShortlist();
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Link href="/">
            <span
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#FF385C",
                letterSpacing: "-0.03em",
              }}
            >
              CollegeScout
            </span>
          </Link>
          <p style={{ color: "#717171", marginTop: "8px", fontSize: "14px" }}>
            {tab === "login"
              ? "Sign in to access your saved colleges"
              : "Create an account to start your shortlist"}
          </p>
        </div>

        {feature && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              background: "#FFF8F6",
              border: "1.5px solid #FFE4E0",
              borderRadius: "12px",
              fontSize: "13px",
              color: "#222222",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "18px" }}>🔒</span>
            <div>
              <span style={{ fontWeight: 600, display: "block" }}>Sign in required</span>
              <span style={{ color: "#717171", fontSize: "12px" }}>
                {feature === "Compare" && "Sign in to compare colleges side-by-side."}
                {feature === "Predictor" && "Sign in to access the admission predictor."}
                {feature === "Shortlist" && "Sign in to view and manage your shortlisted colleges."}
                {!["Compare", "Predictor", "Shortlist"].includes(feature) && `Sign in to access ${feature}.`}
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
            padding: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#F7F7F7",
              borderRadius: "12px",
              padding: "4px",
              marginBottom: "24px",
            }}
          >
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setTab("login");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                background: tab === "login" ? "#fff" : "transparent",
                color: tab === "login" ? "#FF385C" : "#717171",
                boxShadow: tab === "login" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              Sign In
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setTab("register");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                background: tab === "register" ? "#fff" : "transparent",
                color: tab === "register" ? "#FF385C" : "#717171",
                boxShadow: tab === "register" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                color: "#DC2626",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={tab === "login" ? handleLogin : handleRegister}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {tab === "register" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#222222",
                    marginBottom: "6px",
                  }}
                >
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#222222",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#222222",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "register" ? "At least 6 characters" : "Your password"}
                style={inputStyle}
              />
            </div>

            <button
              id="submit-btn"
              type="submit"
              disabled={loading || demoLoading}
              style={{
                width: "100%",
                background: (loading || demoLoading) ? "#FFBDCA" : "#FF385C",
                color: "#fff",
                padding: "13px",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "15px",
                border: "none",
                cursor: (loading || demoLoading) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                marginTop: "4px",
              }}
            >
              {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
            </button>

            <div style={{ textAlign: "center", margin: "16px 0 12px" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", left: 0, right: 0, height: "1px", background: "#E5E7EB" }} />
                <span style={{ position: "relative", background: "#fff", padding: "0 12px", fontSize: "12px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Or
                </span>
              </div>
            </div>

            <button
              type="button"
              id="demo-login-btn"
              disabled={loading || demoLoading}
              onClick={handleDemoLogin}
              style={{
                width: "100%",
                background: "#fff",
                color: "#222222",
                padding: "11px",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "14px",
                border: "1.5px solid #DDDDDD",
                cursor: (loading || demoLoading) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading && !demoLoading) e.currentTarget.style.borderColor = "#222222";
              }}
              onMouseLeave={(e) => {
                if (!loading && !demoLoading) e.currentTarget.style.borderColor = "#DDDDDD";
              }}
            >
              {demoLoading ? "Accessing demo..." : "⚡ Try Demo Account (Evaluator)"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#717171", marginTop: "20px" }}>
          <Link
            href="/"
            style={{ color: "#717171", transition: "color 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FF385C")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#717171")}
          >
            ← Back to CollegeScout
          </Link>
        </p>
      </div>
    </main>
  );
}
