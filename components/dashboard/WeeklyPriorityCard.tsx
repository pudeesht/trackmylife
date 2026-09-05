"use client";

import { FormEvent, useState } from "react";

import type { DayCell } from "@/components/dashboard/dashboard-types";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

type WeeklyPriorityCardProps = {
  weekRangeLabel: string;
  daysLeft: number;
  priority: string | null;
  previousPriority: string | null;
  weekCells: DayCell[];
  isSaving: boolean;
  onSave: (text: string) => void;
};

export function WeeklyPriorityCard({
  weekRangeLabel,
  daysLeft,
  priority,
  previousPriority,
  weekCells,
  isSaving,
  onSave,
}: WeeklyPriorityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(priority ?? "");
  const [syncedPriority, setSyncedPriority] = useState(priority);

  // Reset the draft when the stored priority changes (after a save, or when
  // Sunday rolls the card over to a new, empty week).
  if (priority !== syncedPriority) {
    setSyncedPriority(priority);
    setDraft(priority ?? "");
    setIsEditing(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    onSave(trimmed);
  }

  const isEmpty = !priority;
  const showForm = isEmpty || isEditing;
  const updateDays = weekCells.filter((cell) => cell.entry?.priority_update?.trim()).length;
  const loggedDays = weekCells.filter((cell) => cell.entry).length;
  const resetLabel = daysLeft === 7 ? "New week today" : daysLeft === 1 ? "Last day" : `${daysLeft} days left`;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-sm dark:border-emerald-800 dark:from-emerald-950/60 dark:to-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/70 px-5 py-2.5 dark:border-emerald-900/70">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
          <span aria-hidden className="text-sm">🎯</span>
          This week&apos;s focus
        </p>
        <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80">
          <span>{weekRangeLabel}</span>
          <span aria-hidden>·</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
            {resetLabel}
          </span>
        </div>
      </div>

      <div className="px-5 py-4">
        {showForm ? (
          <>
            <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={120}
                autoFocus={isEditing}
                placeholder="One thing that would make this week a win..."
                className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-emerald-900 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={isSaving || !draft.trim()}
                className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : isEmpty ? "Set focus" : "Save"}
              </button>
              {!isEmpty ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(priority ?? "");
                    setIsEditing(false);
                  }}
                  className="shrink-0 rounded-lg px-2 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                >
                  Cancel
                </button>
              ) : null}
            </form>

            {isEmpty ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-emerald-700/80 dark:text-emerald-400/70">
                <span>Every Sunday this clears so you can pick a fresh one.</span>
                {previousPriority ? (
                  <>
                    <span className="text-emerald-700/60 dark:text-emerald-400/50">
                      Last week: &ldquo;{previousPriority}&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() => setDraft(previousPriority)}
                      className="rounded-md px-1.5 py-0.5 font-semibold underline underline-offset-2 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    >
                      Carry it over
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="min-w-0 flex-1 text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
              {priority}
            </p>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="shrink-0 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
            >
              Edit
            </button>
          </div>
        )}

        {!isEmpty ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200/60 pt-3 dark:border-emerald-900/60">
            <div className="flex items-center gap-1.5" aria-hidden>
              {weekCells.map((cell, index) => {
                const hasUpdate = Boolean(cell.entry?.priority_update?.trim());
                const tone = hasUpdate
                  ? "bg-emerald-600 text-white"
                  : cell.entry
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600";
                return (
                  <span
                    key={cell.dateKey}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${tone} ${
                      cell.isToday ? "ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-zinc-900" : ""
                    }`}
                  >
                    {DAY_LETTERS[index]}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70">
              {updateDays > 0
                ? `Progress noted on ${updateDays} of ${loggedDays} logged ${loggedDays === 1 ? "day" : "days"}`
                : "Log a day to note progress on this"}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
