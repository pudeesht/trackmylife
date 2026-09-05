"use client";

import { useEffect, useMemo } from "react";
import {
  formatBedtime,
  formatDisplayDate,
  formatMetricValue,
  formatMinutesShort,
  getScoreColor,
} from "@/components/dashboard/dashboard-helpers";
import { NotePoints } from "@/components/dashboard/NotePoints";
import type { DailyEntry, MetricDefinition, MetricValue } from "@/components/dashboard/dashboard-types";

type DayDetailModalProps = {
  entry: DailyEntry | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  weekPriority?: string | null;
  // Custom metric definitions plus every logged value; the modal picks out the
  // ones belonging to `entry.entry_date`.
  metricDefs?: MetricDefinition[];
  metricValues?: MetricValue[];
};

export function DayDetailModal({
  entry,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  weekPriority,
  metricDefs = [],
  metricValues = [],
}: DayDetailModalProps) {
  // Built-in metrics live on the entry, custom ones are looked up by date.
  // Definition order (sort_order) is preserved so the modal matches the log panel.
  const metricRows = useMemo(() => {
    if (!entry) {
      return [];
    }

    const rows: { key: string; label: string; value: string }[] = [];

    if (entry.bedtime) {
      rows.push({ key: "bedtime", label: "Bedtime", value: formatBedtime(entry.bedtime) });
    }
    if (entry.instagram_minutes != null) {
      rows.push({ key: "instagram", label: "Instagram", value: formatMinutesShort(entry.instagram_minutes) });
    }

    const valueByMetric = new Map<number, number>();
    for (const value of metricValues) {
      if (value.entry_date === entry.entry_date) {
        valueByMetric.set(value.metric_id, value.value);
      }
    }

    for (const metric of metricDefs) {
      const value = valueByMetric.get(metric.id);
      if (value != null) {
        rows.push({
          key: `metric-${metric.id}`,
          label: metric.name,
          value: formatMetricValue(metric.kind, value, metric.unit),
        });
      }
    }

    return rows;
  }, [entry, metricDefs, metricValues]);

  useEffect(() => {
    if (!entry) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        onPrev();
      } else if (event.key === "ArrowRight") {
        onNext();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [entry, onPrev, onNext]);

  if (!entry) {
    return null;
  }

  const scoreColor = getScoreColor(entry.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Day detail</p>
            <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatDisplayDate(entry.entry_date, { withWeekday: true })}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Close
          </button>
        </div>

        <div className="mt-5 flex items-end gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold text-white shadow-sm"
            style={{ backgroundColor: scoreColor }}
          >
            {entry.score}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">out of 10</p>
        </div>

        {metricRows.length ? (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Metrics</p>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {metricRows.map((row) => (
                <div
                  key={row.key}
                  className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                >
                  <dt className="truncate text-xs text-zinc-500 dark:text-zinc-400">{row.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Note</p>
          <NotePoints note={entry.note} emptyLabel="No note added for this day." className="mt-2" />
        </div>

        {entry.priority_update?.trim().length ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {weekPriority ? (
                <>
                  Update on: <span className="normal-case font-medium text-emerald-800 dark:text-emerald-300">{weekPriority}</span>
                </>
              ) : (
                "Weekly priority update"
              )}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{entry.priority_update}</p>
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
