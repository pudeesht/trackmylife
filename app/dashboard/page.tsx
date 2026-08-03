"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { DayDetailModal } from "@/components/dashboard/DayDetailModal";
import {
  buildCurrentWeek,
  buildMonthGrid,
  buildYearMonthBlocks,
  formatDisplayDate,
  getRecentEntries,
  getStreakStats,
  toDateKey,
  weekStartKey,
} from "@/components/dashboard/dashboard-helpers";
import type {
  DailyEntry,
  MetricDefinition,
  MetricValue,
  ViewMode,
  WeeklyPriority,
} from "@/components/dashboard/dashboard-types";
import { HeatmapLegend } from "@/components/dashboard/HeatmapLegend";
import { LogPanel, type LogEntryPayload } from "@/components/dashboard/LogPanel";
import { MetricsManager } from "@/components/dashboard/MetricsManager";
import { HeatmapMonth } from "@/components/dashboard/HeatmapMonth";
import { HeatmapWeek } from "@/components/dashboard/HeatmapWeek";
import { HeatmapYear } from "@/components/dashboard/HeatmapYear";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { PublicProfileSearch } from "@/components/dashboard/PublicProfileSearch";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { RecentEntriesList } from "@/components/dashboard/RecentEntriesList";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { TimeViewToggle } from "@/components/dashboard/TimeViewToggle";
import { TrendsCard } from "@/components/dashboard/TrendsCard";
import { WeeklyPriorityCard } from "@/components/dashboard/WeeklyPriorityCard";
import { WhatsNewList } from "@/components/changelog/WhatsNewList";
import { LATEST_CHANGELOG_ID } from "@/components/changelog/changelog-data";

function getEmailPrefix(email: string): string {
  const [prefix] = email.split("@");
  return prefix || "user";
}

function toUsernameCandidate(email: string): string {
  const raw = getEmailPrefix(email).toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (raw.length >= 3) {
    return raw.slice(0, 30);
  }
  return "user";
}

type ProfileRow = {
  username: string;
  is_public: boolean;
};

type UtilityPanel = "none" | "search";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [metricDefs, setMetricDefs] = useState<MetricDefinition[]>([]);
  const [metricValues, setMetricValues] = useState<MetricValue[]>([]);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [weeklyPriorities, setWeeklyPriorities] = useState<WeeklyPriority[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateKey());
  const [score, setScore] = useState<number>(7);

  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPriority, setIsSavingPriority] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("year");
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [activeModalDate, setActiveModalDate] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string>("user");
  const [profileIsPublic, setProfileIsPublic] = useState<boolean>(false);
  const [activeUtilityPanel, setActiveUtilityPanel] = useState<UtilityPanel>("none");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  // Highest changelog id this browser has already seen; drives the "new" dot.
  // Read lazily on mount (guarded for SSR, where the header isn't rendered yet).
  const [seenChangelogId, setSeenChangelogId] = useState<number>(() => {
    if (typeof window === "undefined") return LATEST_CHANGELOG_ID;
    const stored = Number.parseInt(window.localStorage.getItem("changelogSeenId") ?? "", 10);
    return Number.isFinite(stored) ? stored : 0;
  });
  const hasUnseenUpdates = LATEST_CHANGELOG_ID > seenChangelogId;

  function openWhatsNew() {
    setActiveUtilityPanel("none");
    setIsSettingsOpen(false);
    setIsWhatsNewOpen(true);
    window.localStorage.setItem("changelogSeenId", String(LATEST_CHANGELOG_ID));
    setSeenChangelogId(LATEST_CHANGELOG_ID);
  }

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();

  const loadEntries = useCallback(async (userId: string) => {
    setIsLoadingEntries(true);
    setError(null);

    const { data, error: loadError } = await supabase
      .from("daily_entries")
      .select("id, user_id, entry_date, score, note, priority_update, bedtime, instagram_minutes, created_at, updated_at")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(500);

    if (loadError) {
      setError(
        "Could not load entries yet. Run the SQL setup in supabase/day3_daily_entries.sql, then refresh."
      );
      setIsLoadingEntries(false);
      return;
    }

    const nextEntries = (data ?? []) as DailyEntry[];
    setEntries(nextEntries);

    const match = nextEntries.find((entry) => entry.entry_date === selectedDate);
    if (match) {
      setScore(match.score);
    } else {
      setScore(7);
    }

    setIsLoadingEntries(false);
  }, [selectedDate]);

  const loadWeeklyPriorities = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("weekly_priorities")
      .select("id, user_id, week_start, priority, created_at, updated_at")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(200);

    setWeeklyPriorities((data ?? []) as WeeklyPriority[]);
  }, []);

  const loadMetricDefinitions = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("metric_definitions")
      .select("id, user_id, name, unit, kind, is_public, sort_order, archived, created_at, updated_at")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("sort_order", { ascending: true });

    setMetricDefs((data ?? []) as MetricDefinition[]);
  }, []);

  const loadMetricValues = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("metric_values")
      .select("id, user_id, metric_id, entry_date, value, created_at, updated_at")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(1000);

    setMetricValues((data ?? []) as MetricValue[]);
  }, []);

  const loadProfile = useCallback(async (userId: string, fallbackEmail: string) => {
    const fallbackUsername = toUsernameCandidate(fallbackEmail);
    const { data, error } = await supabase
      .from("profiles")
      .select("username, is_public")
      .eq("user_id", userId)
      .maybeSingle<ProfileRow>();

    if (error || !data) {
      setProfileUsername(fallbackUsername);
      setProfileIsPublic(false);
      return;
    }

    setProfileUsername(data.username);
    setProfileIsPublic(data.is_public);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error || !data.session) {
        router.replace("/auth");
        return;
      }

      setUser(data.session.user);
      await loadProfile(data.session.user.id, data.session.user.email ?? "");
      await loadEntries(data.session.user.id);
      await loadWeeklyPriorities(data.session.user.id);
      await loadMetricDefinitions(data.session.user.id);
      await loadMetricValues(data.session.user.id);
      setIsCheckingSession(false);

      // Surface release notes once per new release: open them automatically
      // when there's an entry this browser hasn't seen, then mark seen so it
      // won't reopen until the next update. Read localStorage fresh here to
      // avoid depending on render state inside this async flow.
      const seen = Number.parseInt(window.localStorage.getItem("changelogSeenId") ?? "", 10);
      if (!Number.isFinite(seen) || LATEST_CHANGELOG_ID > seen) {
        setIsWhatsNewOpen(true);
        window.localStorage.setItem("changelogSeenId", String(LATEST_CHANGELOG_ID));
        setSeenChangelogId(LATEST_CHANGELOG_ID);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        router.replace("/auth");
        return;
      }

      setUser(session.user);
      loadProfile(session.user.id, session.user.email ?? "");
      loadEntries(session.user.id);
      loadWeeklyPriorities(session.user.id);
      loadMetricDefinitions(session.user.id);
      loadMetricValues(session.user.id);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadEntries, loadWeeklyPriorities, loadProfile, loadMetricDefinitions, loadMetricValues, router]);

  const email = user?.email ?? "";
  const username = useMemo(() => profileUsername || getEmailPrefix(email), [email, profileUsername]);

  const selectedEntry = entries.find((entry) => entry.entry_date === selectedDate);
  const recent = useMemo(() => getRecentEntries(entries), [entries]);

  // metric_id -> stringified value for the selected date, feeding LogPanel inputs.
  const selectedMetricValues = useMemo<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const value of metricValues) {
      if (value.entry_date === selectedDate) {
        map[value.metric_id] = String(value.value);
      }
    }
    return map;
  }, [metricValues, selectedDate]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date)),
    [entries]
  );
  const activeModalEntry = useMemo(
    () => (activeModalDate ? entries.find((entry) => entry.entry_date === activeModalDate) ?? null : null),
    [activeModalDate, entries]
  );
  const activeModalIndex = activeModalDate
    ? sortedEntries.findIndex((entry) => entry.entry_date === activeModalDate)
    : -1;
  const hasPrevModalEntry = activeModalIndex > 0;
  const hasNextModalEntry = activeModalIndex >= 0 && activeModalIndex < sortedEntries.length - 1;

  const yearMonthBlocks = useMemo(
    () => buildYearMonthBlocks(currentYear, entries, today),
    [currentYear, entries, today]
  );
  const monthCells = useMemo(
    () => buildMonthGrid(currentYear, activeMonth, entries, today),
    [activeMonth, currentYear, entries, today]
  );
  const weekCells = useMemo(() => buildCurrentWeek(today, entries), [today, entries]);
  const streak = useMemo(() => getStreakStats(entries, today), [entries, today]);

  const priorityByWeek = useMemo(
    () => new Map(weeklyPriorities.map((item) => [item.week_start, item.priority])),
    [weeklyPriorities]
  );
  const currentWeekKey = useMemo(() => weekStartKey(toDateKey(today)), [today]);
  const currentWeekPriority = priorityByWeek.get(currentWeekKey) ?? null;
  const selectedWeekPriority = priorityByWeek.get(weekStartKey(selectedDate)) ?? null;
  const activeModalWeekPriority = activeModalEntry
    ? priorityByWeek.get(weekStartKey(activeModalEntry.entry_date)) ?? null
    : null;
  const currentWeekLabel = `Week of ${formatDisplayDate(currentWeekKey)}`;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  async function handleSaveEntry(event: React.FormEvent<HTMLFormElement>, payload: LogEntryPayload) {
    event.preventDefault();

    if (!user) {
      setError("Please log in again.");
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    setError(null);

    const cleanNote = payload.note.trim();
    const cleanPriorityUpdate = payload.priorityUpdate.trim();
    const cleanBedtime = payload.bedtime.trim();
    const parsedInstagram = Number.parseInt(payload.instagram, 10);
    const instagramMinutes =
      payload.instagram.trim() !== "" && Number.isFinite(parsedInstagram)
        ? Math.min(1440, Math.max(0, parsedInstagram))
        : null;

    const { error: upsertError } = await supabase.from("daily_entries").upsert(
      {
        user_id: user.id,
        entry_date: selectedDate,
        score,
        note: cleanNote.length ? cleanNote : null,
        priority_update: cleanPriorityUpdate.length ? cleanPriorityUpdate : null,
        bedtime: cleanBedtime.length ? cleanBedtime : null,
        instagram_minutes: instagramMinutes,
      },
      {
        onConflict: "user_id,entry_date",
      }
    );

    if (upsertError) {
      setError(
        "Could not save this entry. Confirm the SQL setup and RLS policies are applied in Supabase."
      );
      setIsSaving(false);
      return;
    }

    // Persist custom metric values for this date: upsert filled-in numbers,
    // clear (delete) any that were emptied. Only active metrics are considered.
    const metricUpserts: { user_id: string; metric_id: number; entry_date: string; value: number }[] = [];
    const metricClears: number[] = [];
    for (const def of metricDefs) {
      const raw = (payload.customMetrics[def.id] ?? "").trim();
      if (raw === "") {
        metricClears.push(def.id);
        continue;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        continue; // ignore malformed input rather than blocking the whole save
      }
      metricUpserts.push({ user_id: user.id, metric_id: def.id, entry_date: selectedDate, value: parsed });
    }

    let metricError = false;
    if (metricUpserts.length) {
      const { error: valueError } = await supabase
        .from("metric_values")
        .upsert(metricUpserts, { onConflict: "user_id,metric_id,entry_date" });
      metricError = metricError || Boolean(valueError);
    }
    if (metricClears.length) {
      const { error: clearError } = await supabase
        .from("metric_values")
        .delete()
        .eq("user_id", user.id)
        .eq("entry_date", selectedDate)
        .in("metric_id", metricClears);
      metricError = metricError || Boolean(clearError);
    }

    setFeedback(metricError ? "Saved, but some custom metrics didn't update." : "Saved. You can edit this date again anytime.");
    await loadEntries(user.id);
    await loadMetricValues(user.id);
    setIsSaving(false);
  }

  async function handleSaveWeeklyPriority(text: string) {
    if (!user) {
      setError("Please log in again.");
      return;
    }

    const cleanPriority = text.trim();
    if (!cleanPriority) {
      return;
    }

    setIsSavingPriority(true);
    setError(null);

    const { error: upsertError } = await supabase.from("weekly_priorities").upsert(
      {
        user_id: user.id,
        week_start: currentWeekKey,
        priority: cleanPriority,
      },
      {
        onConflict: "user_id,week_start",
      }
    );

    if (upsertError) {
      setError(
        "Could not save this week's priority. Confirm supabase/day5_weekly_priorities.sql has been run."
      );
      setIsSavingPriority(false);
      return;
    }

    await loadWeeklyPriorities(user.id);
    setIsSavingPriority(false);
  }

  function openDayDetailByDate(dateKey: string) {
    const entry = entries.find((item) => item.entry_date === dateKey);
    if (entry) {
      setActiveModalDate(dateKey);
    }
  }

  function handleModalPrev() {
    if (hasPrevModalEntry) {
      setActiveModalDate(sortedEntries[activeModalIndex - 1].entry_date);
    }
  }

  function handleModalNext() {
    if (hasNextModalEntry) {
      setActiveModalDate(sortedEntries[activeModalIndex + 1].entry_date);
    }
  }

  function handleDateChange(nextDate: string) {
    setSelectedDate(nextDate);

    const match = entries.find((entry) => entry.entry_date === nextDate);
    if (match) {
      setScore(match.score);
      setFeedback("Loaded previous entry for this date.");
    } else {
      setScore(7);
      setFeedback(null);
    }
    setError(null);
  }

  function handleMonthClick(monthIndex: number) {
    setActiveMonth(monthIndex);
    setViewMode("month");
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Checking your session...</p>
      </main>
    );
  }

  return (
    <>
      <main className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.12),rgba(16,185,129,0)_70%)]"
        />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 py-8">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ProfileHeader username={username} isPublic={profileIsPublic} onLogout={handleLogout} />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveUtilityPanel((panel) => (panel === "search" ? "none" : "search"));
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    activeUtilityPanel === "search"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  }`}
                >
                  Search
                </button>

                <Link
                  href="/explore"
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Explore
                </Link>

                <button
                  type="button"
                  onClick={openWhatsNew}
                  className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    isWhatsNewOpen
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  }`}
                >
                  What&apos;s new
                  {hasUnseenUpdates ? (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveUtilityPanel("none");
                    setIsSettingsOpen(true);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    isSettingsOpen
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>

            {activeUtilityPanel === "search" ? (
              <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <PublicProfileSearch
                  currentUsername={username.toLowerCase()}
                  onDone={() => setActiveUtilityPanel("none")}
                />
              </div>
            ) : null}
          </section>

          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-4">
              <TimeViewToggle mode={viewMode} onChange={setViewMode} />
              <StreakBadge currentStreak={streak.current} bestStreak={streak.best} />
            </div>

            <div className="transition-all duration-300">
              {viewMode === "year" ? (
                <HeatmapYear
                  monthBlocks={yearMonthBlocks}
                  onMonthClick={handleMonthClick}
                  onCellClick={(cell) => openDayDetailByDate(cell.dateKey)}
                />
              ) : null}

              {viewMode === "month" ? (
                <HeatmapMonth
                  monthTitle={new Date(currentYear, activeMonth, 1).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                  cells={monthCells}
                  onCellClick={(cell) => openDayDetailByDate(cell.dateKey)}
                />
              ) : null}

              {viewMode === "week" ? (
                <>
                  <WeeklyPriorityCard
                    weekLabel={currentWeekLabel}
                    priority={currentWeekPriority}
                    isSaving={isSavingPriority}
                    onSave={handleSaveWeeklyPriority}
                  />
                  <HeatmapWeek cells={weekCells} onCellClick={(cell) => openDayDetailByDate(cell.dateKey)} />
                </>
              ) : null}
            </div>

            <HeatmapLegend />
          </section>

          <TrendsCard entries={entries} metricDefs={metricDefs} metricValues={metricValues} today={today} />

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <LogPanel
              selectedDate={selectedDate}
              score={score}
              selectedEntry={selectedEntry}
              isSaving={isSaving}
              isLoadingEntries={isLoadingEntries}
              feedback={feedback}
              error={error}
              onDateChange={handleDateChange}
              onScoreChange={setScore}
              initialNote={selectedEntry?.note ?? ""}
              weekPriority={selectedWeekPriority}
              initialPriorityUpdate={selectedEntry?.priority_update ?? ""}
              initialBedtime={selectedEntry?.bedtime ? selectedEntry.bedtime.slice(0, 5) : ""}
              initialInstagram={
                selectedEntry?.instagram_minutes != null ? String(selectedEntry.instagram_minutes) : ""
              }
              metricDefs={metricDefs}
              initialMetricValues={selectedMetricValues}
              onManageMetrics={() => setIsMetricsOpen(true)}
              onSubmit={handleSaveEntry}
            />

            <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                <RecentEntriesList entries={recent} onOpen={(entry) => setActiveModalDate(entry.entry_date)} />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SettingsModal
        open={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
        }}
      >
        {user ? (
          <ProfileSettings
            userId={user.id}
            initialUsername={profileUsername}
            initialIsPublic={profileIsPublic}
            compact
            onUpdated={(next) => {
              setProfileUsername(next.username);
              setProfileIsPublic(next.isPublic);
              setIsSettingsOpen(false);
            }}
          />
        ) : null}
      </SettingsModal>

      <SettingsModal
        open={isWhatsNewOpen}
        title="What's new"
        onClose={() => setIsWhatsNewOpen(false)}
      >
        <WhatsNewList />
      </SettingsModal>

      <SettingsModal open={isMetricsOpen} title="Custom metrics" onClose={() => setIsMetricsOpen(false)}>
        {user ? (
          <MetricsManager
            userId={user.id}
            metrics={metricDefs}
            onChanged={() => loadMetricDefinitions(user.id)}
          />
        ) : null}
      </SettingsModal>

      <DayDetailModal
        entry={activeModalEntry}
        onClose={() => setActiveModalDate(null)}
        onPrev={handleModalPrev}
        onNext={handleModalNext}
        hasPrev={hasPrevModalEntry}
        hasNext={hasNextModalEntry}
        weekPriority={activeModalWeekPriority}
        metricDefs={metricDefs}
        metricValues={metricValues}
      />
    </>
  );
}
