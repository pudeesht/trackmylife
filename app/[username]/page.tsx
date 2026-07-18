"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DayDetailModal } from "@/components/dashboard/DayDetailModal";
import { HeatmapLegend } from "@/components/dashboard/HeatmapLegend";
import { HeatmapYear } from "@/components/dashboard/HeatmapYear";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { TrendsCard } from "@/components/dashboard/TrendsCard";
import {
  buildYearMonthBlocks,
  formatDisplayDate,
  getBestAndWorst,
  getScoreColor,
} from "@/components/dashboard/dashboard-helpers";
import type { DailyEntry, DashboardStats } from "@/components/dashboard/dashboard-types";

type PublicProfileResponse = {
  exists: boolean;
  username: string;
  is_public: boolean;
  stats?: DashboardStats;
  recent?: DailyEntry[];
  entries?: DailyEntry[];
};

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default function PublicProfilePage({ params }: ProfilePageProps) {
  const { username: routeUsername } = use(params);

  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [activeModalDate, setActiveModalDate] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(`/api/profile/${encodeURIComponent(routeUsername)}`);
        if (response.status === 404) {
          if (!ignore) {
            setProfile(null);
            setIsLoading(false);
          }
          return;
        }

        if (!response.ok) {
          if (!ignore) {
            setHasError(true);
            setIsLoading(false);
          }
          return;
        }

        const data = (await response.json()) as PublicProfileResponse;
        if (!ignore) {
          setProfile(data);
          setIsLoading(false);
        }
      } catch {
        if (!ignore) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [routeUsername]);

  const entries = useMemo(() => profile?.entries ?? [], [profile]);
  const stats = profile?.stats;
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date)),
    [entries]
  );
  const sortedEntriesAsc = useMemo(
    () => [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date)),
    [entries]
  );
  const activeModalEntry = useMemo(
    () => (activeModalDate ? entries.find((entry) => entry.entry_date === activeModalDate) ?? null : null),
    [activeModalDate, entries]
  );
  const activeModalIndex = activeModalDate
    ? sortedEntriesAsc.findIndex((entry) => entry.entry_date === activeModalDate)
    : -1;
  const hasPrevModalEntry = activeModalIndex > 0;
  const hasNextModalEntry = activeModalIndex >= 0 && activeModalIndex < sortedEntriesAsc.length - 1;
  const bestAndWorst = useMemo(() => getBestAndWorst(entries), [entries]);
  const initials = useMemo(() => {
    const clean = (profile?.username ?? routeUsername).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (!clean) return "U";
    return clean.slice(0, 2);
  }, [profile?.username, routeUsername]);

  const yearMonthBlocks = useMemo(
    () => buildYearMonthBlocks(currentYear, entries, today),
    [currentYear, entries, today]
  );

  function openDayDetailByDate(dateKey: string) {
    const entry = entries.find((item) => item.entry_date === dateKey);
    if (entry) {
      setActiveModalDate(dateKey);
    }
  }

  function handleModalPrev() {
    if (hasPrevModalEntry) {
      setActiveModalDate(sortedEntriesAsc[activeModalIndex - 1].entry_date);
    }
  }

  function handleModalNext() {
    if (hasNextModalEntry) {
      setActiveModalDate(sortedEntriesAsc[activeModalIndex + 1].entry_date);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFeedback("Copied");
    } catch {
      setCopyFeedback("Copy failed");
    }

    window.setTimeout(() => {
      setCopyFeedback(null);
    }, 1500);
  }

  function getNotePreview(note: string | null): string {
    const clean = (note ?? "").trim();
    if (!clean) {
      return "No note";
    }

    if (clean.length <= 90) {
      return clean;
    }

    return `${clean.slice(0, 90)}...`;
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading Daymap...</p>
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Could not load this profile</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Please try again in a moment.</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No Daymap found for this username</h1>
      </main>
    );
  }

  const displayName = profile.username;

  if (!profile.is_public) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{displayName}</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Daymap · {currentYear} · Private profile</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ← Dashboard
          </Link>
        </header>

        <section className="mt-10">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">This profile is private</p>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{displayName}</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Daymap · {currentYear} · Public profile</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              ← Dashboard
            </Link>
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Copy link
            </button>
          </div>
        </header>

        {copyFeedback ? <p className="mt-2 text-right text-xs text-zinc-500 dark:text-zinc-400">{copyFeedback}</p> : null}

        {stats ? <StatsGrid stats={stats} /> : null}

        <section className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{currentYear} heatmap</p>
          <HeatmapYear
            monthBlocks={yearMonthBlocks}
            onMonthClick={() => {}}
            onCellClick={(cell) => openDayDetailByDate(cell.dateKey)}
            readOnly
            showTitle={false}
          />

          <HeatmapLegend />
        </section>

        <TrendsCard entries={entries} today={today} />

        <hr className="mt-8 border-zinc-200 dark:border-zinc-800" />

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Best days</p>
            <div className="mt-3 space-y-3">
              {bestAndWorst.best.map((entry) => (
                <button
                  key={`best-${entry.id}`}
                  type="button"
                  onClick={() => setActiveModalDate(entry.entry_date)}
                  className="w-full rounded-md border border-zinc-200 p-3 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatDisplayDate(entry.entry_date)}</p>
                    <span className="text-sm font-semibold" style={{ color: getScoreColor(entry.score) }}>
                      {entry.score}/10
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{getNotePreview(entry.note)}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Worst days</p>
            <div className="mt-3 space-y-3">
              {bestAndWorst.worst.map((entry) => (
                <button
                  key={`worst-${entry.id}`}
                  type="button"
                  onClick={() => setActiveModalDate(entry.entry_date)}
                  className="w-full rounded-md border border-zinc-200 p-3 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatDisplayDate(entry.entry_date)}</p>
                    <span className="text-sm font-semibold" style={{ color: getScoreColor(entry.score) }}>
                      {entry.score}/10
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{getNotePreview(entry.note)}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">All entries</p>
          <div className="mt-3 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {sortedEntries.map((entry) => (
              <article key={`entry-${entry.id}`} className="flex items-start justify-between gap-4 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="mt-1 block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getScoreColor(entry.score) }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatDisplayDate(entry.entry_date)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">
                      {entry.note?.trim().length ? entry.note : "No note"}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-sm font-semibold" style={{ color: getScoreColor(entry.score) }}>
                  {entry.score}/10
                </span>
              </article>
            ))}
          </div>
        </section>
      </main>

      <DayDetailModal
        entry={activeModalEntry}
        onClose={() => setActiveModalDate(null)}
        onPrev={handleModalPrev}
        onNext={handleModalNext}
        hasPrev={hasPrevModalEntry}
        hasNext={hasNextModalEntry}
      />
    </>
  );
}
