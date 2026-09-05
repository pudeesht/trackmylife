"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";

import { parseNotePoints, serializeNotePoints } from "@/components/dashboard/dashboard-helpers";
import { PointsEditor } from "@/components/dashboard/PointsEditor";
import type { DayCell } from "@/components/dashboard/dashboard-types";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// Three is the point of the feature: a week with ten priorities has none. The
// budget is measured against the serialized text, so the "- " prefix and the
// newline between points come out of it.
export const MAX_PRIORITY_POINTS = 3;
const PRIORITY_MAX_CHARS = 300;
const RECAP_MAX_CHARS = 600;

// Whether the card is collapsed is a per-browser preference, not user data, so
// it lives in localStorage. The card starts collapsed, so the stored value is
// only ever the opt-out: "0" means this browser opened it and wants it open.
// /dashboard is prerendered, so it is read through useSyncExternalStore: the
// server snapshot renders the collapsed default and the client swaps in the
// stored value after hydration, with no mismatch and no effect.
const COLLAPSE_KEY = "trackmylife:priority-card-collapsed";
const COLLAPSE_EVENT = "trackmylife:priority-card-collapsed-change";

function subscribeToCollapsed(onChange: () => void) {
  // "storage" covers the same preference being changed in another tab.
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSE_EVENT, onChange);
  };
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) !== "0";
  } catch {
    // Private windows and blocked site data throw on access; stay collapsed.
    return true;
  }
}

function writeCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  } catch {
    // Preference is not persistable here; the event below still updates the UI.
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

type WeeklyPriorityCardProps = {
  weekRangeLabel: string;
  daysLeft: number;
  priority: string | null;
  weekCells: DayCell[];
  /** Last week's priority and recap, for the carry-over and the recap prompt. */
  previousPriority: string | null;
  previousRecap: string | null;
  previousWeekRangeLabel: string;
  isSaving: boolean;
  isSavingRecap: boolean;
  onSave: (text: string) => void;
  onSaveRecap: (text: string) => void;
};

// Always keep one row on screen, even before anything is written.
function toEditablePoints(text: string | null): string[] {
  const points = parseNotePoints(text);
  return points.length ? points : [""];
}

export function WeeklyPriorityCard({
  weekRangeLabel,
  daysLeft,
  priority,
  weekCells,
  previousPriority,
  previousRecap,
  previousWeekRangeLabel,
  isSaving,
  isSavingRecap,
  onSave,
  onSaveRecap,
}: WeeklyPriorityCardProps) {
  const isCollapsed = useSyncExternalStore(subscribeToCollapsed, readCollapsed, () => true);
  const [isEditing, setIsEditing] = useState(false);
  const [draftPoints, setDraftPoints] = useState<string[]>(() => toEditablePoints(priority));
  const [syncedPriority, setSyncedPriority] = useState(priority);

  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [draftRecap, setDraftRecap] = useState(previousRecap ?? "");
  const [syncedRecap, setSyncedRecap] = useState(previousRecap);

  // Reset the drafts when the stored values change (after a save, or when
  // Sunday rolls the card over to a new, empty week).
  if (priority !== syncedPriority) {
    setSyncedPriority(priority);
    setDraftPoints(toEditablePoints(priority));
    setIsEditing(false);
  }
  if (previousRecap !== syncedRecap) {
    setSyncedRecap(previousRecap);
    setDraftRecap(previousRecap ?? "");
    setIsRecapOpen(false);
  }

  const points = parseNotePoints(priority);
  const isEmpty = points.length === 0;
  const showForm = isEmpty || isEditing;

  const serializedDraft = serializeNotePoints(draftPoints);
  const charsLeft = Math.max(0, PRIORITY_MAX_CHARS - serializedDraft.length);
  const loggedDays = weekCells.filter((cell) => cell.entry).length;
  // Weeks run Sunday to Saturday, so a full week left means today is Sunday.
  const isSunday = daysLeft === 7;
  const resetLabel = isSunday ? "New week today" : daysLeft === 1 ? "Last day" : `${daysLeft} days left`;

  const previousPoints = parseNotePoints(previousPriority);
  const hasRecap = Boolean(previousRecap?.trim());
  // The recap closes out the week that just ended, so it is asked for once, on
  // the Sunday after it - not every day of the new week. Nothing to recap
  // against if last week never had a priority set.
  const showRecapRow = previousPoints.length > 0 && isSunday;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serializedDraft) {
      return;
    }
    onSave(serializedDraft);
  }

  function handleRecapSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draftRecap.trim();
    if (!trimmed) {
      return;
    }
    onSaveRecap(trimmed);
  }

  if (isCollapsed) {
    return (
      <section className="mt-6">
        <button
          type="button"
          onClick={() => writeCollapsed(false)}
          aria-expanded={false}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-left transition hover:bg-emerald-100/70 dark:border-emerald-900 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40"
        >
          <span className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
            <span aria-hidden className="text-sm">🎯</span>
            <span className="truncate">
              {isEmpty ? "Set this week's priority" : `Priority (${points.length})`}
            </span>
            {/* The recap prompt is inside the card, so flag it out here rather
                than letting a collapsed card hide it for the whole week. */}
            {showRecapRow && !hasRecap ? (
              <span
                title="Last week is waiting for a recap"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
              />
            ) : null}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80">
            <span className="hidden sm:inline">{weekRangeLabel}</span>
            <span aria-hidden>▾</span>
          </span>
        </button>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-sm dark:border-emerald-800 dark:from-emerald-950/60 dark:to-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/70 px-5 py-2.5 dark:border-emerald-900/70">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
          <span aria-hidden className="text-sm">🎯</span>
          This week&apos;s priority
        </p>
        <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80">
          <span>{weekRangeLabel}</span>
          <span aria-hidden>·</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
            {resetLabel}
          </span>
          <button
            type="button"
            onClick={() => writeCollapsed(true)}
            aria-expanded
            aria-label="Collapse this week's priority"
            className="-mr-1 rounded-lg px-1.5 py-0.5 text-sm leading-none text-emerald-700/70 transition hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-400/70 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-200"
          >
            ×
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        {showForm ? (
          <form onSubmit={handleSubmit}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-emerald-800/80 dark:text-emerald-300/80">
                Up to {MAX_PRIORITY_POINTS} things that would make this week a win.
              </p>
              <p className="text-[11px] text-emerald-700/60 dark:text-emerald-400/60">{charsLeft} left</p>
            </div>

            <PointsEditor
              points={draftPoints}
              onChange={setDraftPoints}
              maxPoints={MAX_PRIORITY_POINTS}
              charsLeft={charsLeft}
              firstPlaceholder="Your main focus this week..."
              nextPlaceholder="Another priority..."
              itemNoun="Priority"
              tone="emerald"
              hint="Enter for the next one"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={isSaving || !serializedDraft}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : isEmpty ? "Set priority" : "Save"}
              </button>
              {!isEmpty ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraftPoints(toEditablePoints(priority));
                    setIsEditing(false);
                  }}
                  className="rounded-lg px-2 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                >
                  Cancel
                </button>
              ) : null}
              {isEmpty && previousPoints.length ? (
                <button
                  type="button"
                  onClick={() => setDraftPoints(previousPoints)}
                  className="rounded-lg px-2 py-2 text-xs font-semibold text-emerald-700 underline underline-offset-2 transition hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                >
                  Carry over last week
                </button>
              ) : null}
            </div>

            {isEmpty ? (
              <p className="mt-2 text-xs text-emerald-700/70 dark:text-emerald-400/60">
                Every Sunday this clears so you can set a fresh one.
              </p>
            ) : null}
          </form>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <ol className="min-w-0 flex-1 space-y-1.5">
              {points.map((point, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 break-words text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                    {point}
                  </span>
                </li>
              ))}
            </ol>
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
                const tone = cell.entry
                  ? "bg-emerald-600 text-white"
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
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70">{loggedDays} of 7 days logged</p>
          </div>
        ) : null}
      </div>

      {showRecapRow ? (
        <div className="border-t border-emerald-200/70 bg-white/60 px-5 py-3 dark:border-emerald-900/70 dark:bg-zinc-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <span aria-hidden>📋 </span>
              Last week&apos;s recap
              <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-400 dark:text-zinc-500">
                {previousWeekRangeLabel}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setIsRecapOpen((open) => !open)}
              aria-expanded={isRecapOpen}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
            >
              {isRecapOpen ? "Close" : hasRecap ? "Edit" : "Write recap"}
            </button>
          </div>

          {!isRecapOpen && hasRecap ? (
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{previousRecap}</p>
          ) : null}

          {!isRecapOpen && !hasRecap ? (
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              How did it actually go against what you aimed for?
            </p>
          ) : null}

          {isRecapOpen ? (
            <form onSubmit={handleRecapSubmit} className="mt-2">
              <ol className="mb-2 space-y-1 rounded-lg bg-emerald-50/70 p-2.5 dark:bg-emerald-950/40">
                {previousPoints.map((point, index) => (
                  <li key={index} className="flex gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                    <span aria-hidden className="font-bold">
                      {index + 1}.
                    </span>
                    <span className="min-w-0 break-words">{point}</span>
                  </li>
                ))}
              </ol>

              <textarea
                value={draftRecap}
                onChange={(event) => setDraftRecap(event.target.value)}
                rows={4}
                maxLength={RECAP_MAX_CHARS}
                autoFocus
                placeholder="What actually happened, against what you aimed for?"
                className="w-full resize-y rounded-lg border border-zinc-300 px-2.5 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />

              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="submit"
                  disabled={isSavingRecap || !draftRecap.trim()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingRecap ? "Saving..." : "Save recap"}
                </button>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {RECAP_MAX_CHARS - draftRecap.length} left
                </p>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
