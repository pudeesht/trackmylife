"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  getScoreColor,
  parseNotePoints,
  serializeNotePoints,
} from "@/components/dashboard/dashboard-helpers";
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
  /** Latest loggable day (today) - the date input must not offer the future. */
  maxDate: string;
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

// The note is stored as a single text column but written as a bullet list. The
// budget is measured against the serialized note, so the "- " prefix and the
// newline between points (3 chars per point) come out of it. Nothing but this
// constant caps a note: the column is unbounded text and no API validates it.
const NOTE_MAX_CHARS = 600;
const MAX_POINTS = 20;

// Always keep one row on screen, even for a day with no note yet.
function toEditablePoints(note: string): string[] {
  const points = parseNotePoints(note);
  return points.length ? points : [""];
}

function LogPanelInner({
  selectedDate,
  maxDate,
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
  const [draftPoints, setDraftPoints] = useState<string[]>(() => toEditablePoints(initialNote));
  const [draftPriorityUpdate, setDraftPriorityUpdate] = useState(initialPriorityUpdate);
  const [draftBedtime, setDraftBedtime] = useState(initialBedtime);
  const [draftInstagram, setDraftInstagram] = useState(initialInstagram);
  const [draftMetrics, setDraftMetrics] = useState<Record<number, string>>(initialMetricValues);
  const [showExtras, setShowExtras] = useState(Boolean(initialBedtime || initialInstagram));
  const hasMetricValues = Object.values(initialMetricValues).some((value) => value !== "");
  const [showMetrics, setShowMetrics] = useState(hasMetricValues);

  // Which point input takes the caret after the list changes shape (Enter
  // added a row, backspace removed one, "Add point" appended one).
  const pointInputs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [focusPoint, setFocusPoint] = useState<number | null>(null);

  // Re-seed all drafts when navigating to a different date (not while typing).
  useEffect(() => {
    setDraftPoints(toEditablePoints(initialNote));
    setDraftPriorityUpdate(initialPriorityUpdate);
    setDraftBedtime(initialBedtime);
    setDraftInstagram(initialInstagram);
    setDraftMetrics(initialMetricValues);
    setShowExtras(Boolean(initialBedtime || initialInstagram));
    setShowMetrics(Object.values(initialMetricValues).some((value) => value !== ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (focusPoint == null) {
      return;
    }
    pointInputs.current[focusPoint]?.focus();
    setFocusPoint(null);
  }, [focusPoint]);

  // A point is a textarea so a long one wraps instead of scrolling sideways;
  // each row is grown to fit its own content so the list has no inner scrollbars.
  useEffect(() => {
    for (const element of pointInputs.current) {
      if (!element) {
        continue;
      }
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    }
  }, [draftPoints]);

  const serializedNote = serializeNotePoints(draftPoints);
  const charsLeft = Math.max(0, NOTE_MAX_CHARS - serializedNote.length);

  function updatePoint(index: number, value: string) {
    // Nothing may type a newline into a point (Enter is intercepted below), but
    // pasted multi-line text can. Split it so one pasted line is one point,
    // rather than letting a newline silently become a point on the next load.
    if (value.includes("\n")) {
      const pasted = value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      setDraftPoints((prev) => {
        const merged = [...prev.slice(0, index), ...(pasted.length ? pasted : [""]), ...prev.slice(index + 1)];
        return merged.slice(0, MAX_POINTS);
      });
      setFocusPoint(Math.min(index + Math.max(pasted.length, 1) - 1, MAX_POINTS - 1));
      return;
    }

    setDraftPoints((prev) => prev.map((point, i) => (i === index ? value : point)));
  }

  function addPointAfter(index: number) {
    setDraftPoints((prev) => {
      if (prev.length >= MAX_POINTS) {
        return prev;
      }
      return [...prev.slice(0, index + 1), "", ...prev.slice(index + 1)];
    });
    setFocusPoint(Math.min(index + 1, MAX_POINTS - 1));
  }

  function removePoint(index: number) {
    setDraftPoints((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [""];
    });
    setFocusPoint(Math.max(0, index - 1));
  }

  function handlePointKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (event.key === "Enter") {
      // Enter starts the next point instead of submitting the form.
      event.preventDefault();
      addPointAfter(index);
      return;
    }

    if (event.key === "Backspace" && draftPoints[index] === "" && draftPoints.length > 1) {
      event.preventDefault();
      removePoint(index);
    }
  }

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <form
        onSubmit={(event) => {
          onSubmit(event, {
            note: serializedNote,
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
              max={maxDate}
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

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Note</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{charsLeft} left</p>
          </div>

          <ul className="mt-1.5 space-y-1.5">
            {draftPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <span aria-hidden className="mt-4 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                <textarea
                  ref={(element) => {
                    pointInputs.current[index] = element;
                  }}
                  rows={1}
                  value={point}
                  onChange={(event) => updatePoint(index, event.target.value)}
                  onKeyDown={(event) => handlePointKeyDown(event, index)}
                  // The budget is shared across points, so any one row may only
                  // grow into what is left of the whole note allowance.
                  maxLength={point.length + charsLeft}
                  aria-label={`Point ${index + 1}`}
                  placeholder={index === 0 ? "What happened today?" : "Another point..."}
                  className="min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => removePoint(index)}
                  aria-label={`Remove point ${index + 1}`}
                  className="mt-0.5 shrink-0 rounded-lg px-2 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => addPointAfter(draftPoints.length - 1)}
              disabled={draftPoints.length >= MAX_POINTS}
              className="text-xs font-semibold text-emerald-700 underline-offset-2 transition hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline dark:text-emerald-400 dark:disabled:text-zinc-600"
            >
              + Add point
            </button>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Enter for a new point</p>
          </div>
        </div>

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
