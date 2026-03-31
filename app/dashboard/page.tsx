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
  computeStats,
  getRecentEntries,
  toDateKey,
} from "@/components/dashboard/dashboard-helpers";
import type { DailyEntry, ViewMode } from "@/components/dashboard/dashboard-types";
import { HeatmapLegend } from "@/components/dashboard/HeatmapLegend";
import { LogPanel } from "@/components/dashboard/LogPanel";
import { HeatmapMonth } from "@/components/dashboard/HeatmapMonth";
import { HeatmapWeek } from "@/components/dashboard/HeatmapWeek";
import { HeatmapYear } from "@/components/dashboard/HeatmapYear";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { TimeViewToggle } from "@/components/dashboard/TimeViewToggle";

function getEmailPrefix(email: string): string {
  const [prefix] = email.split("@");
  return prefix || "user";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateKey());
  const [score, setScore] = useState<number>(7);
  const [note, setNote] = useState("");

  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("year");
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [activeModalEntry, setActiveModalEntry] = useState<DailyEntry | null>(null);

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();

  const loadEntries = useCallback(async (userId: string) => {
    setIsLoadingEntries(true);
    setError(null);

    const { data, error: loadError } = await supabase
      .from("daily_entries")
      .select("id, user_id, entry_date, score, note, created_at, updated_at")
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
      setNote(match.note ?? "");
    } else {
      setScore(7);
      setNote("");
    }

    setIsLoadingEntries(false);
  }, [selectedDate]);

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
      await loadEntries(data.session.user.id);
      setIsCheckingSession(false);
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
      loadEntries(session.user.id);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadEntries, router]);

  const email = user?.email ?? "";
  const username = useMemo(() => getEmailPrefix(email), [email]);

  const selectedEntry = entries.find((entry) => entry.entry_date === selectedDate);
  const stats = useMemo(() => computeStats(entries, currentYear), [entries, currentYear]);
  const recent = useMemo(() => getRecentEntries(entries), [entries]);

  const yearMonthBlocks = useMemo(
    () => buildYearMonthBlocks(currentYear, entries, today),
    [currentYear, entries, today]
  );
  const monthCells = useMemo(
    () => buildMonthGrid(currentYear, activeMonth, entries, today),
    [activeMonth, currentYear, entries, today]
  );
  const weekCells = useMemo(() => buildCurrentWeek(today, entries), [today, entries]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  async function handleSaveEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("Please log in again.");
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    setError(null);

    const cleanNote = note.trim();

    const { error: upsertError } = await supabase.from("daily_entries").upsert(
      {
        user_id: user.id,
        entry_date: selectedDate,
        score,
        note: cleanNote.length ? cleanNote : null,
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

    setFeedback("Saved. You can edit this date again anytime.");
    await loadEntries(user.id);
    setIsSaving(false);
  }

  function openDayDetailByDate(dateKey: string) {
    const entry = entries.find((item) => item.entry_date === dateKey);
    if (entry) {
      setActiveModalEntry(entry);
    }
  }

  function handleDateChange(nextDate: string) {
    setSelectedDate(nextDate);

    const match = entries.find((entry) => entry.entry_date === nextDate);
    if (match) {
      setScore(match.score);
      setNote(match.note ?? "");
      setFeedback("Loaded previous entry for this date.");
    } else {
      setScore(7);
      setNote("");
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
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-12">
        <p className="text-sm text-zinc-600">Checking your session...</p>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <ProfileHeader username={username} onLogout={handleLogout} />
        <StatsGrid stats={stats} />

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="flex items-center justify-between gap-4">
              <TimeViewToggle mode={viewMode} onChange={setViewMode} />
              <p className="text-xs text-zinc-500">Hover cells for date and note preview</p>
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
                <HeatmapWeek cells={weekCells} onCellClick={(cell) => openDayDetailByDate(cell.dateKey)} />
              ) : null}
            </div>

            <HeatmapLegend />
          </section>

          <LogPanel
            selectedDate={selectedDate}
            score={score}
            note={note}
            selectedEntry={selectedEntry}
            isSaving={isSaving}
            isLoadingEntries={isLoadingEntries}
            feedback={feedback}
            error={error}
            onDateChange={handleDateChange}
            onScoreChange={setScore}
            onNoteChange={setNote}
            onSubmit={handleSaveEntry}
            recentEntries={recent}
            onOpenEntry={setActiveModalEntry}
          />
        </div>

        <Link href="/" className="mt-6 text-sm text-zinc-700 underline underline-offset-4">
          Return to home
        </Link>
      </main>

      <DayDetailModal entry={activeModalEntry} onClose={() => setActiveModalEntry(null)} />
    </>
  );
}
