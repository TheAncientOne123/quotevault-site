"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  useEffect(() => {
    if (isAdmin && !isLoading) {
      router.replace(next);
    }
  }, [isAdmin, isLoading, router, next]);

  if (isAdmin && !isLoading) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const ok = await login(password);
    setSubmitting(false);
    if (ok) {
      toast.success("Signed in");
      router.replace(next);
    } else {
      setError("Invalid password");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-semibold text-[var(--foreground)]">
              QuoteVault
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Admin access
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="login-password" className="block text-sm font-medium text-[var(--foreground)]">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--muted)]"
              placeholder="Admin password"
              required
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--foreground)] py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="text-center">
            <a
              href="/"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ← Back to quotes
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--muted)]">Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
