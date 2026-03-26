"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type DailyEntry = {
  id: number;
  user_id: string;
  entry_date: string;
  score: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

function getLocalDateString(date = new Date()): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function formatDateLabel(yyyyMmDd: string): string {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [score, setScore] = useState<number>(7);
  const [note, setNote] = useState("");
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async (userId: string) => {
    setIsLoadingEntries(true);
    setError(null);

    const { data, error: loadError } = await supabase
      .from("daily_entries")
      .select("id, user_id, entry_date, score, note, created_at, updated_at")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(30);

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

  const email = useMemo(() => user?.email ?? "", [user?.email]);
  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.entry_date === selectedDate),
    [entries, selectedDate]
  );

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

  if (isCheckingSession) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-12">
        <p className="text-sm text-zinc-600">Checking your session...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">TrackMyLife</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Signed in as {email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Log out
        </button>
      </header>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Daily check-in</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Rate your day from 1-10. You can edit any past day later.
            </p>
          </div>
          {selectedEntry ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              Existing entry found
            </span>
          ) : null}
        </div>

        <form onSubmit={handleSaveEntry} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="entry-date" className="text-sm font-medium text-zinc-700">
              Date
            </label>
            <input
              id="entry-date"
              type="date"
              value={selectedDate}
              onChange={(event) => handleDateChange(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring"
            />
            <p className="text-xs text-zinc-500">{formatDateLabel(selectedDate)}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="score" className="text-sm font-medium text-zinc-700">
              Score: <span className="font-semibold text-zinc-900">{score}</span>/10
            </label>
            <input
              id="score"
              type="range"
              min={1}
              max={10}
              step={1}
              value={score}
              onChange={(event) => setScore(Number(event.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>1 (rough day)</span>
              <span>10 (great day)</span>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="note" className="text-sm font-medium text-zinc-700">
              Optional note
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What shaped your day?"
              rows={4}
              maxLength={500}
              className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring"
            />
            <p className="text-xs text-zinc-500">{note.length}/500</p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}

          <button
            type="submit"
            disabled={isSaving || isLoadingEntries}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : selectedEntry ? "Update entry" : "Save entry"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Recent entries</h2>
        <p className="mt-1 text-sm text-zinc-600">Latest 30 days you have logged.</p>

        {isLoadingEntries ? <p className="mt-4 text-sm text-zinc-600">Loading history...</p> : null}

        {!isLoadingEntries && entries.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">No entries yet. Add your first day above.</p>
        ) : null}

        {entries.length > 0 ? (
          <div className="mt-4 space-y-2">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleDateChange(entry.entry_date)}
                className="flex w-full items-start justify-between rounded-lg border border-zinc-200 px-3 py-2 text-left transition hover:bg-zinc-50"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{formatDateLabel(entry.entry_date)}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                    {entry.note?.trim().length ? entry.note : "No note"}
                  </p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700">
                  {entry.score}/10
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <Link href="/" className="mt-6 text-sm text-zinc-700 underline underline-offset-4">
        Return to home
      </Link>
    </main>
  );
}
