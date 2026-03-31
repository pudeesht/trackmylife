"use client";

import React from "react";
import { getScoreColor } from "@/components/dashboard/dashboard-helpers";
import { RecentEntriesList } from "@/components/dashboard/RecentEntriesList";
import type { DailyEntry } from "@/components/dashboard/dashboard-types";

type LogPanelProps = {
  selectedDate: string;
  score: number;
  note: string;
  selectedEntry: DailyEntry | undefined;
  isSaving: boolean;
  isLoadingEntries: boolean;
  feedback: string | null;
  error: string | null;
  onDateChange: (date: string) => void;
  onScoreChange: (score: number) => void;
  onNoteChange: (note: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  recentEntries?: DailyEntry[];
  onOpenEntry?: (entry: DailyEntry) => void;
};

function LogPanelInner({
  selectedDate,
  score,
  note,
  selectedEntry,
  isSaving,
  isLoadingEntries,
  feedback,
  error,
  onDateChange,
  onScoreChange,
  onNoteChange,
  onSubmit,
  recentEntries = [],
  onOpenEntry,
}: LogPanelProps) {
  return (
    <aside className="rounded-xl border border-zinc-200 bg-white p-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Log today</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {selectedEntry ? "Editing existing entry" : "No entry yet for selected date"}
          </p>
        </div>

        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Date
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-sky-500 focus:ring"
          />
        </label>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Score</p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => {
              const isSelected = score === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onScoreChange(value)}
                  className={`h-9 rounded-md text-sm font-semibold transition ${
                    isSelected ? "ring-2 ring-zinc-900 ring-offset-1" : "opacity-90 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: getScoreColor(value),
                    color: value <= 5 ? "#111827" : "#ffffff",
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Note
          <textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Optional note..."
            className="mt-1 w-full resize-none rounded-md border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-sky-500 focus:ring"
          />
        </label>

        <button
          type="submit"
          disabled={isSaving || isLoadingEntries}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : selectedEntry ? "Update entry" : "Save entry"}
        </button>

        {feedback ? <p className="text-xs text-emerald-700">{feedback}</p> : null}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </form>

      {recentEntries.length > 0 && onOpenEntry && <RecentEntriesList entries={recentEntries} onOpen={onOpenEntry} />}
    </aside>
  );
}

export const LogPanel = React.memo(LogPanelInner);
