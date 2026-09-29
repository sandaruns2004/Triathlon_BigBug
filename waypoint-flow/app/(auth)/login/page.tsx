"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const ROLE_REDIRECT: Record<string, string> = {
  dispatcher:    "/dispatcher",
  loader:        "/loader",
  driver:        "/driver",
  store_manager: "/store",
};

export default function LoginPage() {
  const router                  = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      // Generic error — never reveal if the email exists
      setError("Invalid email or password. Please try again.");
      return;
    }

    // Fetch session to get role, then redirect
    const res     = await fetch("/api/auth/session");
    const session = await res.json();
    const role    = session?.user?.role;
    router.push(ROLE_REDIRECT[role] ?? "/");
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (green, desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-wp-pale px-12 py-16">
        <div>
          <div className="flex items-center gap-3 mb-20">
            <div className="w-9 h-9 rounded-[8px] bg-wp-green flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-wp-green font-bold text-lg tracking-tight">Waypoint Flow</span>
          </div>
          <h1 className="text-4xl font-semibold text-wp-ink leading-tight tracking-tight mb-4">
            Connected delivery<br />operations.
          </h1>
          <p className="text-wp-muted text-base leading-relaxed">
            One system for dispatchers, loaders,<br />
            drivers, and store managers.
          </p>
        </div>
        <p className="text-xs text-wp-muted">
          Waypoint Group · Peliyagoda &amp; Kandy
        </p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile wordmark */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-[7px] bg-wp-green flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold text-wp-ink">Waypoint Flow</span>
          </div>

          <h2 className="text-2xl font-semibold text-wp-ink mb-1">Welcome back</h2>
          <p className="text-wp-muted text-sm mb-8">Sign in with your work email.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="field-label">Work email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                placeholder="you@waypoint.lk"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-wp-muted hover:text-wp-ink p-1"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 h-12 text-base"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-wp-border">
            <p className="text-xs text-wp-muted text-center">
              Accounts are provisioned by Waypoint administration.
              <br />Contact your depot manager to activate your account.
            </p>
          </div>

          {/* Demo credentials (for judges) */}
          <details className="mt-4 text-xs text-wp-muted">
            <summary className="cursor-pointer hover:text-wp-ink">Demo credentials ↓</summary>
            <div className="mt-2 space-y-1 bg-wp-canvas rounded-card p-3 font-mono text-[11px]">
              <p>dispatcher@waypoint.lk / waypoint2026</p>
              <p>loader@waypoint.lk / waypoint2026</p>
              <p>driver@waypoint.lk / waypoint2026</p>
              <p>store@waypoint.lk / waypoint2026</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
