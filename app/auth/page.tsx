"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buttonText = useMemo(() => {
    if (loading) {
      if (mode === "login") return "Logging in...";
      if (mode === "signup") return "Creating account...";
      return "Sending link...";
    }
    if (mode === "login") return "Log in";
    if (mode === "signup") return "Create account";
    return "Send reset link";
  }, [loading, mode]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "forgot") {
      if (!normalizedEmail) {
        setError("Enter your email address.");
        setLoading(false);
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        // Deliberately the same message whether or not the account exists, so
        // this form can't be used to discover which emails are registered.
        setMessage("If an account exists for that email, a reset link is on its way. Check your inbox.");
      }

      setLoading(false);
      return;
    }

    if (!normalizedEmail || !password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Account created. Check your email if confirmation is enabled.");
      }

      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          TrackMyLife
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Log your daily score from 1 to 10 and build your life heatmap.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-xl bg-zinc-100 p-1 text-sm dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`rounded-lg px-3 py-2 font-medium transition ${
            mode !== "signup"
              ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`rounded-lg px-3 py-2 font-medium transition ${
            mode === "signup"
              ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-emerald-500 transition focus:ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        {mode === "forgot" ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            We&apos;ll email you a link to set a new password.
          </p>
        ) : (
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-xs font-medium text-zinc-600 underline underline-offset-4 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Forgot password?
                </button>
              ) : null}
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-emerald-500 transition focus:ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              placeholder="Enter your password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>
        )}

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {buttonText}
        </button>
      </form>

      {mode === "forgot" ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Remembered it?{" "}
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            Back to log in
          </button>
        </p>
      ) : (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          New here? Choose <span className="font-medium">Sign up</span>. Already have an account? Use <span className="font-medium">Log in</span>.
        </p>
      )}

      <Link href="/" className="mt-6 text-sm text-zinc-700 underline underline-offset-4 dark:text-zinc-300">
        Back to landing page
      </Link>
    </main>
  );
}
