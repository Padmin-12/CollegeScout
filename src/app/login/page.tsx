"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      router.push(callbackUrl);
      router.refresh();
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

      // Auto-login after registration
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
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#F7F7F7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 16px",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/">
            <span style={{ fontSize: "26px", fontWeight: 700, color: "#FF385C", letterSpacing: "-0.03em" }}>
              CollegeHunt
            </span>
          </Link>
          <p style={{ color: "#717171", marginTop: "8px", fontSize: "14px" }}>
            {tab === "login"
              ? "Sign in to access your saved colleges"
              : "Create an account to start your shortlist"}
          </p>
        </div>

        <div style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
          padding: "32px",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex",
            background: "#F7F7F7",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "24px",
          }}>
            <button
              id="tab-login"
              onClick={() => { setTab("login"); setError(""); }}
              style={{
                flex: 1, padding: "8px", borderRadius: "8px",
                fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer",
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
              onClick={() => { setTab("register"); setError(""); }}
              style={{
                flex: 1, padding: "8px", borderRadius: "8px",
                fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer",
                background: tab === "register" ? "#fff" : "transparent",
                color: tab === "register" ? "#FF385C" : "#717171",
                boxShadow: tab === "register" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              Create Account
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: "16px", padding: "12px 16px",
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: "8px", color: "#DC2626", fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={tab === "login" ? handleLogin : handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {tab === "register" && (
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#222222", marginBottom: "6px" }}>
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
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#222222", marginBottom: "6px" }}>
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
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#222222", marginBottom: "6px" }}>
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
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#FFBDCA" : "#FF385C",
                color: "#fff",
                padding: "13px",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "15px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                marginTop: "4px",
              }}
            >
              {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
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
            ← Back to CollegeHunt
          </Link>
        </p>
      </div>
    </main>
  );
}

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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
