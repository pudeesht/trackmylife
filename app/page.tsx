"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const SCORE_COLORS: Record<number, string> = {
  1: "#7f0000",
  2: "#c0392b",
  3: "#e74c3c",
  4: "#e67e22",
  5: "#f39c12",
  6: "#f1c40f",
  7: "#90ee90",
  8: "#27ae60",
  9: "#1abc9c",
  10: "#0d4d3d",
};

// Fixed (non-random) pattern so server and client render identical markup.
const MOCK_SCORES = [
  6, 7, 5, 8, 9, 4, 7,
  8, 9, 7, 3, 6, 8, 9,
  5, 6, 8, 9, 10, 7, 8,
  9, 8, 10, 9, 7, 6, 9,
  7, 8, 9, 10, 9, 8, 10,
];

function MockHeatmap() {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {MOCK_SCORES.map((score, i) => (
        <span
          key={i}
          className="h-6 w-6 rounded-md shadow-sm sm:h-8 sm:w-8"
          style={{ backgroundColor: SCORE_COLORS[score] }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.18),rgba(16,185,129,0)_70%)]"
      />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-sm font-bold tracking-wide text-zinc-900">TrackMyLife</span>
        <Link
          href="/auth"
          className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
        >
          Sign in
        </Link>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 pb-24 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
        <div>
          <p className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            TrackMyLife
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
            Your daily life score, visualized like a coding heatmap.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-zinc-600">
            Every day, rate your day from 1 to 10 and optionally add a note. Over time, your pattern tells the real story.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={session ? "/dashboard" : "/auth"}
              className="rounded-lg bg-zinc-900 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 hover:shadow-md"
            >
              {isLoading ? "Checking session..." : session ? "Open dashboard" : "Get started"}
            </Link>
            <Link
              href="/auth"
              className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Sign in / Sign up
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/50 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-900">Last 5 weeks</span>
            <span className="text-xs text-zinc-400">just now</span>
          </div>
          <div className="mt-5">
            <MockHeatmap />
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500">
            <span>Low</span>
            <div className="flex items-center gap-0.5">
              {Object.values(SCORE_COLORS).map((hex, i) => (
                <span key={i} className="h-3 w-2 rounded-[1px]" style={{ backgroundColor: hex }} />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-3">
          <article className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-lg">
              📊
            </div>
            <h2 className="mt-4 text-sm font-semibold text-zinc-900">1-10 Daily Score</h2>
            <p className="mt-1 text-sm text-zinc-600">Simple reflection that takes less than 20 seconds.</p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-lg">
              📝
            </div>
            <h2 className="mt-4 text-sm font-semibold text-zinc-900">Optional Note</h2>
            <p className="mt-1 text-sm text-zinc-600">Capture the reason behind your rating when needed.</p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-lg">
              🔗
            </div>
            <h2 className="mt-4 text-sm font-semibold text-zinc-900">Public or Private</h2>
            <p className="mt-1 text-sm text-zinc-600">Share weekly updates with your audience whenever you want.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
