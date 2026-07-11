"use client";

import React, { useState } from "react";
import { getScoreColor } from "@/components/dashboard/dashboard-helpers";
import type { DailyEntry } from "@/components/dashboard/dashboard-types";

type LogPanelProps = {
  selectedDate: string;
  score: number;
  selectedEntry: DailyEntry | undefined;
  isSaving: boolean;
  isLoadingEntries: boolean;
  feedback: string | null;
  error: string | null;
  onDateChange: (date: string) => void;
  onScoreChange: (score: number) => void;
  initialNote: string;
  weekPriority: string | null;
  initialPriorityUpdate: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>, note: string, priorityUpdate: string) => void;
};

function LogPanelInner({
  selectedDate,
  score,
  selectedEntry,
  isSaving,
  isLoadingEntries,
  feedback,
  error,
  onDateChange,
  onScoreChange,
  initialNote,
  weekPriority,
  initialPriorityUpdate,
  onSubmit,
}: LogPanelProps) {
  const [draftNote, setDraftNote] = useState(initialNote);
  const [draftPriorityUpdate, setDraftPriorityUpdate] = useState(initialPriorityUpdate);

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <form
        onSubmit={(event) => {
          onSubmit(event, draftNote, draftPriorityUpdate);
        }}
        className="space-y-5"
      >
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Log today</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {selectedEntry ? "Editing existing entry" : "No entry yet for selected date"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[11rem_1fr] sm:items-start">
          <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Date
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2"
            />
          </label>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Score</p>
            <div className="mt-1 flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => {
                const isSelected = score === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onScoreChange(value)}
                    className={`flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-semibold transition ${
                      isSelected
                        ? "z-10 ring-2 ring-emerald-600 ring-offset-1 scale-105"
                        : "opacity-90 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: getScoreColor(value), color: value <= 5 ? "#111827" : "#ffffff" }}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Note
          <textarea
            key={selectedDate}
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
            rows={weekPriority ? 7 : 10}
            maxLength={500}
            placeholder="Optional note..."
            className="mt-1 w-full resize-y rounded-lg border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2"
          />
        </label>

        {weekPriority ? (
          <label className="block text-xs font-medium uppercase tracking-wide text-emerald-700">
            Update on: <span className="normal-case text-emerald-800">{weekPriority}</span>
            <textarea
              key={`priority-${selectedDate}`}
              value={draftPriorityUpdate}
              onChange={(event) => setDraftPriorityUpdate(event.target.value)}
              rows={3}
              maxLength={300}
              placeholder="How did today move this forward? (optional)"
              className="mt-1 w-full resize-y rounded-lg border border-emerald-200 bg-emerald-50/40 px-2.5 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2"
            />
          </label>
        ) : null}

        <button
          type="submit"
          disabled={isSaving || isLoadingEntries}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : selectedEntry ? "Update entry" : "Save entry"}
        </button>

        {feedback ? <p className="text-xs font-medium text-emerald-700">{feedback}</p> : null}
        {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      </form>
    </aside>
  );
}

export const LogPanel = React.memo(LogPanelInner);
