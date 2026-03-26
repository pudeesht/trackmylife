"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">TrackMyLife</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-zinc-900">
        Your daily life score, visualized like a coding heatmap.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-zinc-600">
        Every day, rate your day from 1 to 10 and optionally add a note. Over time, your pattern tells the real story.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={session ? "/dashboard" : "/auth"}
          className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          {isLoading ? "Checking session..." : session ? "Open dashboard" : "Get started"}
        </Link>
        <Link
          href="/auth"
          className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Sign in / Sign up
        </Link>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">1-10 Daily Score</h2>
          <p className="mt-1 text-sm text-zinc-600">Simple reflection that takes less than 20 seconds.</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Optional Note</h2>
          <p className="mt-1 text-sm text-zinc-600">Capture the reason behind your rating when needed.</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Public or Private</h2>
          <p className="mt-1 text-sm text-zinc-600">Share weekly updates with your audience whenever you want.</p>
        </article>
      </section>
    </main>
  );
}
