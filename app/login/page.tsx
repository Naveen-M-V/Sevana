"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconCross, IconUserPlus } from "@/components/icons";
import { api } from "@/lib/api";

function AuthCard() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "create">("signin");

  // Sign In state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Create Account state
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerRole, setRegisterRole] = useState("doctor");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined" && document.cookie.includes("sevana_sid=")) {
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") && next !== "/" ? next : "/dashboard");
    }
  }, [router, params]);

  const navigateAfterAuth = () => {
    const next = params.get("next");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") && next !== "/" ? next : "/dashboard");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.post("/api/auth/login", { email: loginEmail, password: loginPassword });
      navigateAfterAuth();
    } catch (e: any) {
      setErr(e.message || "Invalid credentials. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (registerPassword.length < 6) {
      setErr("Password must be at least 6 characters long.");
      return;
    }
    if (registerPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await api.post("/api/auth/register", {
        fullName,
        email: registerEmail,
        role: registerRole,
        password: registerPassword,
      });
      navigateAfterAuth();
    } catch (e: any) {
      setErr(e.message || "Failed to create account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-card">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="brand-mark big" aria-hidden style={{ display: "grid", placeItems: "center" }}>
          <IconCross size={20} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Sevana HIMS</h2>
          <div className="small muted">Hospital Information Management System</div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        style={{
          display: "flex",
          background: "#f1f5f9",
          padding: 4,
          borderRadius: 10,
          marginTop: 6,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setErr(null);
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "13.5px",
            fontWeight: 600,
            borderRadius: 7,
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            background: mode === "signin" ? "#ffffff" : "transparent",
            color: mode === "signin" ? "var(--color-accent-700)" : "var(--muted)",
            boxShadow: mode === "signin" ? "var(--shadow-sm)" : "none",
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("create");
            setErr(null);
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "13.5px",
            fontWeight: 600,
            borderRadius: 7,
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            background: mode === "create" ? "#ffffff" : "transparent",
            color: mode === "create" ? "var(--color-accent-700)" : "var(--muted)",
            boxShadow: mode === "create" ? "var(--shadow-sm)" : "none",
          }}
        >
          Create Account
        </button>
      </div>

      {err && (
        <div className="alert alert-crit" role="alert" style={{ fontSize: "13px" }}>
          {err}
        </div>
      )}

      {mode === "signin" ? (
        <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label htmlFor="login-email">Work Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="e.g. doctor@hospital.com"
              autoComplete="username"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="login-pw">Password</label>
            <input
              id="login-pw"
              className="input"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary wide" disabled={busy} type="submit" style={{ marginTop: 4 }}>
            {busy ? "Signing in…" : "Sign In"}
          </button>

          <div style={{ textAlign: "center", fontSize: "13.5px", marginTop: 4, color: "var(--muted)" }}>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("create");
                setErr(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-accent)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Create an account
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCreateAccount} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              className="input"
              type="text"
              placeholder="e.g. Dr. Rajesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="reg-email">Work Email</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              placeholder="name@hospital.com"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="reg-role">Role / Department</label>
            <select
              id="reg-role"
              className="input"
              value={registerRole}
              onChange={(e) => setRegisterRole(e.target.value)}
            >
              <option value="doctor">Doctor / Clinician</option>
              <option value="nurse">Nursing Staff</option>
              <option value="front_office">Front Desk / Reception</option>
              <option value="billing">Billing Executive</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="store_manager">Store & Inventory Manager</option>
              <option value="admin">HIMS Administrator</option>
              <option value="superintendent">Medical Superintendent</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="reg-pw">Password</label>
            <input
              id="reg-pw"
              className="input"
              type="password"
              placeholder="At least 6 characters"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              className="input"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary wide" disabled={busy} type="submit" style={{ marginTop: 4 }}>
            <IconUserPlus size={16} style={{ marginRight: 6 }} />
            {busy ? "Creating account…" : "Create Account"}
          </button>

          <div style={{ textAlign: "center", fontSize: "13.5px", marginTop: 4, color: "var(--muted)" }}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErr(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-accent)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Sign In
            </button>
          </div>
        </form>
      )}

      <div
        className="small muted"
        style={{
          marginTop: 10,
          paddingTop: 12,
          borderTop: "1px solid var(--line)",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        Access is logged and monitored. Patient records are confidential under the DPDP Act, 2023.
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <div className="login">
      <Suspense>
        <AuthCard />
      </Suspense>
    </div>
  );
}
