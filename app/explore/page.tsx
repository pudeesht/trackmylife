"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { getScoreColor, toDateKey } from "@/components/dashboard/dashboard-helpers";

type ExploreProfile = {
  username: string;
  entriesLast7: number;
  totalEntries: number;
  lastEntryDate: string;
  avgScoreLast7: number | null;
  recentDays: Array<{ date: string; score: number }>;
};

type ExploreResponse = {
  profiles: ExploreProfile[];
  offset: number;
  hasMore: boolean;
};

/** Date keys for the trailing 7 days, oldest first, so every card shares one x-axis. */
function buildWeekWindow(today: Date): string[] {
  const keys: string[] = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    keys.push(toDateKey(date));
  }
  return keys;
}

function formatLastActive(lastEntryDate: string, todayKey: string): string {
  if (lastEntryDate === todayKey) {
    return "Logged today";
  }

  const diffMs = new Date(`${todayKey}T00:00:00`).getTime() - new Date(`${lastEntryDate}T00:00:00`).getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 1) return "Logged yesterday";
  return `Logged ${diffDays} days ago`;
}

function getInitials(username: string): string {
  const clean = username.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return clean.slice(0, 2) || "U";
}

function ProfileCard({ profile, weekWindow, todayKey }: {
  profile: ExploreProfile;
  weekWindow: string[];
  todayKey: string;
}) {
  const scoreByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of profile.recentDays) {
      map.set(day.date, day.score);
    }
    return map;
  }, [profile.recentDays]);

  return (
    <Link
      href={`/${profile.username}`}
      className="flex flex-col rounded-xl border border-zinc-200 p-4 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {getInitials(profile.username)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{profile.username}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatLastActive(profile.lastEntryDate, todayKey)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1" aria-hidden="true">
        {weekWindow.map((dateKey) => {
          const score = scoreByDate.get(dateKey);
          return (
            <span
              key={dateKey}
              className="h-6 flex-1 rounded-sm border border-zinc-200 dark:border-zinc-800"
              style={score === undefined ? undefined : { backgroundColor: getScoreColor(score), borderColor: "transparent" }}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {profile.entriesLast7} of last 7 days
        </p>
        {profile.avgScoreLast7 === null ? null : (
          <p className="text-xs font-semibold" style={{ color: getScoreColor(Math.round(profile.avgScoreLast7)) }}>
            {profile.avgScoreLast7.toFixed(1)} avg
          </p>
        )}
      </div>
    </Link>
  );
}

export default function ExplorePage() {
  const [profiles, setProfiles] = useState<ExploreProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);
  const weekWindow = useMemo(() => buildWeekWindow(today), [today]);

  const loadPage = useCallback(async (offset: number) => {
    const response = await fetch(`/api/explore?offset=${offset}`);
    if (!response.ok) {
      throw new Error("Could not load explore feed");
    }
    return (await response.json()) as ExploreResponse;
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadFirstPage() {
      setIsLoading(true);
      setHasError(false);

      try {
        const data = await loadPage(0);
        if (!ignore) {
          setProfiles(data.profiles ?? []);
          setHasMore(data.hasMore);
          setIsLoading(false);
        }
      } catch {
        if (!ignore) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    loadFirstPage();

    return () => {
      ignore = true;
    };
  }, [loadPage]);

  // The feed itself is public; the session only decides where the header links back to.
  useEffect(() => {
    let ignore = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!ignore) {
        setSession(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLoadMore() {
    setIsLoadingMore(true);

    try {
      const data = await loadPage(profiles.length);
      setProfiles((current) => [...current, ...(data.profiles ?? [])]);
      setHasMore(data.hasMore);
    } catch {
      setHasError(true);
    }

    setIsLoadingMore(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Explore</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Public Daymaps, sorted by who has been logging most this week
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ← Home
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Sign up
            </Link>
          )}
        </div>
      </header>

      {isLoading ? (
        <p className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">Loading public Daymaps...</p>
      ) : null}

      {hasError && profiles.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
          Could not load the explore feed. Please try again in a moment.
        </p>
      ) : null}

      {!isLoading && !hasError && profiles.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
          Nobody is logging publicly right now.
          {session ? " Make your profile public to show up here." : " Sign up and make your profile public to show up here."}
        </p>
      ) : null}

      {profiles.length > 0 ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.username}
              profile={profile}
              weekWindow={weekWindow}
              todayKey={todayKey}
            />
          ))}
        </section>
      ) : null}

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </main>
  );
}
