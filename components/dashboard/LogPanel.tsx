"use client";

import React, { useEffect, useState } from "react";
import { getScoreColor } from "@/components/dashboard/dashboard-helpers";
import type { DailyEntry, MetricDefinition } from "@/components/dashboard/dashboard-types";

export type LogEntryPayload = {
  note: string;
  priorityUpdate: string;
  bedtime: string;
  instagram: string;
  // metric_id -> raw input string ("" means "not logged / clear").
  customMetrics: Record<number, string>;
};

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
  initialBedtime: string;
  initialInstagram: string;
  metricDefs: MetricDefinition[];
  initialMetricValues: Record<number, string>;
  onManageMetrics: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>, payload: LogEntryPayload) => void;
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
  initialBedtime,
  initialInstagram,
  metricDefs,
  initialMetricValues,
  onManageMetrics,
  onSubmit,
}: LogPanelProps) {
  const [draftNote, setDraftNote] = useState(initialNote);
  const [draftPriorityUpdate, setDraftPriorityUpdate] = useState(initialPriorityUpdate);
  const [draftBedtime, setDraftBedtime] = useState(initialBedtime);
  const [draftInstagram, setDraftInstagram] = useState(initialInstagram);
  const [draftMetrics, setDraftMetrics] = useState<Record<number, string>>(initialMetricValues);
  const [showExtras, setShowExtras] = useState(Boolean(initialBedtime || initialInstagram));
  const hasMetricValues = Object.values(initialMetricValues).some((value) => value !== "");
  const [showMetrics, setShowMetrics] = useState(hasMetricValues);

  // Re-seed all drafts when navigating to a different date (not while typing).
  useEffect(() => {
    setDraftNote(initialNote);
    setDraftPriorityUpdate(initialPriorityUpdate);
    setDraftBedtime(initialBedtime);
    setDraftInstagram(initialInstagram);
    setDraftMetrics(initialMetricValues);
    setShowExtras(Boolean(initialBedtime || initialInstagram));
    setShowMetrics(Object.values(initialMetricValues).some((value) => value !== ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <form
        onSubmit={(event) => {
          onSubmit(event, {
            note: draftNote,
            priorityUpdate: draftPriorityUpdate,
            bedtime: draftBedtime,
            instagram: draftInstagram,
            customMetrics: draftMetrics,
          });
        }}
        className="space-y-5"
      >
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Log today</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {selectedEntry ? "Editing existing entry" : "No entry yet for selected date"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[11rem_1fr] sm:items-start">
          <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Date
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Score</p>
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

        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Note
          <textarea
            key={selectedDate}
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
            rows={weekPriority ? 7 : 10}
            maxLength={500}
            placeholder="Optional note..."
            className="mt-1 w-full resize-y rounded-lg border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>

        {weekPriority ? (
          <label className="block text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Update on: <span className="normal-case text-emerald-800 dark:text-emerald-300">{weekPriority}</span>
            <textarea
              key={`priority-${selectedDate}`}
              value={draftPriorityUpdate}
              onChange={(event) => setDraftPriorityUpdate(event.target.value)}
              rows={3}
              maxLength={300}
              placeholder="How did today move this forward? (optional)"
              className="mt-1 w-full resize-y rounded-lg border border-emerald-200 bg-emerald-50/40 px-2.5 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-zinc-100"
            />
          </label>
        ) : null}

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowExtras((value) => !value)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 transition hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <span className="flex items-center gap-2">
              Sleep &amp; screen time
              {!showExtras && (draftBedtime || draftInstagram) ? (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              ) : null}
            </span>
            <span aria-hidden>{showExtras ? "▾" : "▸"}</span>
          </button>

          {showExtras ? (
            <div className="grid gap-3 border-t border-zinc-100 p-3 sm:grid-cols-2 dark:border-zinc-800">
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Bedtime
                <input
                  type="time"
                  value={draftBedtime}
                  onChange={(event) => setDraftBedtime(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Instagram (min)
                <input
                  type="number"
                  min={0}
                  max={1440}
                  inputMode="numeric"
                  value={draftInstagram}
                  onChange={(event) => setDraftInstagram(event.target.value)}
                  placeholder="e.g. 90"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowMetrics((value) => !value)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 transition hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <span className="flex items-center gap-2">
              Custom metrics
              {!showMetrics && hasMetricValues ? (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              ) : null}
            </span>
            <span aria-hidden>{showMetrics ? "▾" : "▸"}</span>
          </button>

          {showMetrics ? (
            <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
              {metricDefs.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {metricDefs.map((metric) => (
                    <label
                      key={metric.id}
                      className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                    >
                      {metric.name}
                      {metric.kind === "duration" ? " (min)" : metric.unit ? ` (${metric.unit})` : ""}
                      <input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={draftMetrics[metric.id] ?? ""}
                        onChange={(event) =>
                          setDraftMetrics((prev) => ({ ...prev, [metric.id]: event.target.value }))
                        }
                        placeholder={metric.kind === "duration" ? "e.g. 30" : "e.g. 3"}
                        className="mt-1 w-full rounded-lg border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No custom metrics yet. Create one to start tracking it here.
                </p>
              )}
              <button
                type="button"
                onClick={onManageMetrics}
                className="mt-3 text-xs font-semibold text-emerald-700 underline-offset-2 transition hover:underline dark:text-emerald-400"
              >
                Manage metrics
              </button>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSaving || isLoadingEntries}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isSaving ? "Saving..." : selectedEntry ? "Update entry" : "Save entry"}
        </button>

        {feedback ? <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{feedback}</p> : null}
        {error ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
      </form>
    </aside>
  );
}

export const LogPanel = React.memo(LogPanelInner);
