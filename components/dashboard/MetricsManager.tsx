"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { MetricDefinition, MetricKind } from "@/components/dashboard/dashboard-types";

// Keep in sync with the DB cap trigger in supabase/day8_custom_metrics.sql.
export const MAX_ACTIVE_METRICS = 2;
const NAME_MAX = 24;
const UNIT_MAX = 16;

type MetricsManagerProps = {
  userId: string;
  metrics: MetricDefinition[]; // active metrics only
  // Called after any successful mutation so the parent can reload from the DB.
  onChanged: () => Promise<void> | void;
};

const KIND_OPTIONS: { value: MetricKind; label: string; hint: string }[] = [
  { value: "number", label: "Number", hint: "e.g. glasses of water, steps" },
  { value: "duration", label: "Duration", hint: "minutes, shown as 1h 30m" },
];

function describeError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message ?? "";
  if (code === "23505") return "You already have a metric with that name.";
  if (message.includes("metric cap reached")) return `You can have at most ${MAX_ACTIVE_METRICS} custom metrics.`;
  return "Could not save that change. Please try again.";
}

export function MetricsManager({ userId, metrics, onChanged }: MetricsManagerProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [kind, setKind] = useState<MetricKind>("number");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atCap = metrics.length >= MAX_ACTIVE_METRICS;

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError("Give the metric a name.");
      return;
    }
    if (atCap) {
      setError(`You can have at most ${MAX_ACTIVE_METRICS} custom metrics.`);
      return;
    }

    setBusy(true);
    const cleanUnit = unit.trim();
    const { error: insertError } = await supabase.from("metric_definitions").insert({
      user_id: userId,
      name: cleanName,
      unit: kind === "number" && cleanUnit ? cleanUnit : null,
      kind,
      sort_order: metrics.length,
    });

    if (insertError) {
      setError(describeError(insertError));
      setBusy(false);
      return;
    }

    setName("");
    setUnit("");
    setKind("number");
    await onChanged();
    setBusy(false);
  }

  async function handleArchive(metric: MetricDefinition) {
    setError(null);
    setBusy(true);
    const { error: updateError } = await supabase
      .from("metric_definitions")
      .update({ archived: true })
      .eq("id", metric.id);

    if (updateError) {
      setError(describeError(updateError));
      setBusy(false);
      return;
    }

    await onChanged();
    setBusy(false);
  }

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Custom metrics
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Track up to {MAX_ACTIVE_METRICS} of your own metrics alongside bedtime and Instagram. Archiving keeps past
        data but hides the metric from logging.
      </p>

      {metrics.length ? (
        <ul className="mt-3 space-y-2">
          {metrics.map((metric) => (
            <li
              key={metric.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {metric.name}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {metric.kind === "duration" ? "Duration (min)" : metric.unit ? `Number · ${metric.unit}` : "Number"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleArchive(metric)}
                disabled={busy}
                className="shrink-0 rounded-md border border-zinc-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Archive
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No custom metrics yet. Add one below.
        </p>
      )}

      {atCap ? (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          You&apos;ve reached the limit of {MAX_ACTIVE_METRICS}. Archive one to add another.
        </p>
      ) : (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError(null);
                }}
                maxLength={NAME_MAX}
                placeholder="e.g. Water"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Type</span>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as MetricKind)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {kind === "number" ? (
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Unit (optional)</span>
              <input
                type="text"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                maxLength={UNIT_MAX}
                placeholder="e.g. glasses, kg, steps"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </label>
          ) : (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {KIND_OPTIONS.find((option) => option.value === kind)?.hint}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {busy ? "Saving..." : "Add metric"}
          </button>
        </form>
      )}

      {error ? <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </section>
  );
}
