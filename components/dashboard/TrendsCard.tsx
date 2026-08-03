"use client";

import { useMemo, useState } from "react";
import {
  bedtimeToLatenessMinutes,
  formatMetricValue,
  formatMinutesShort,
  latenessToClockLabel,
  toDateKey,
} from "@/components/dashboard/dashboard-helpers";
import { MetricTrendChart, type TrendPoint } from "@/components/dashboard/MetricTrendChart";
import type { DailyEntry, MetricDefinition, MetricValue } from "@/components/dashboard/dashboard-types";

type TrendsCardProps = {
  entries: DailyEntry[];
  // Optional so callers without custom metrics can omit them; both the
  // dashboard and public profiles pass them through.
  metricDefs?: MetricDefinition[];
  metricValues?: MetricValue[];
  today: Date;
};

const RANGES = [30, 90] as const;
type Range = (typeof RANGES)[number];

const BEDTIME_COLOR = "#6366f1"; // indigo — sleep/night
const INSTAGRAM_COLOR = "#f43f5e"; // rose — screen time
// Palette for custom metrics, distinct from the two built-ins above.
const CUSTOM_COLORS = ["#10b981", "#f59e0b"]; // emerald, amber

function windowStart(today: Date, days: number): string {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
  return toDateKey(start);
}

export function TrendsCard({ entries, metricDefs = [], metricValues = [], today }: TrendsCardProps) {
  const [range, setRange] = useState<Range>(30);

  const endKey = toDateKey(today);
  const startKey = useMemo(() => windowStart(today, range), [today, range]);

  const { bedtimePoints, instagramPoints } = useMemo(() => {
    const inWindow = entries.filter((e) => e.entry_date >= startKey && e.entry_date <= endKey);
    const sorted = [...inWindow].sort((a, b) => a.entry_date.localeCompare(b.entry_date));

    const bedtime: TrendPoint[] = [];
    const instagram: TrendPoint[] = [];
    for (const entry of sorted) {
      const lateness = bedtimeToLatenessMinutes(entry.bedtime);
      if (lateness != null) {
        bedtime.push({ dateKey: entry.entry_date, value: lateness });
      }
      if (entry.instagram_minutes != null) {
        instagram.push({ dateKey: entry.entry_date, value: entry.instagram_minutes });
      }
    }
    return { bedtimePoints: bedtime, instagramPoints: instagram };
  }, [entries, startKey, endKey]);

  // One windowed, ascending series per active custom metric that has data.
  const customSeries = useMemo(() => {
    const pointsByMetric = new Map<number, TrendPoint[]>();
    const inWindow = metricValues.filter((v) => v.entry_date >= startKey && v.entry_date <= endKey);
    const sorted = [...inWindow].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
    for (const value of sorted) {
      const list = pointsByMetric.get(value.metric_id) ?? [];
      list.push({ dateKey: value.entry_date, value: value.value });
      pointsByMetric.set(value.metric_id, list);
    }

    return metricDefs
      .map((metric) => ({ metric, points: pointsByMetric.get(metric.id) ?? [] }))
      .filter((series) => series.points.length > 0);
  }, [metricDefs, metricValues, startKey, endKey]);

  const hasAnyMetric =
    entries.some((e) => e.bedtime != null || e.instagram_minutes != null) || customSeries.length > 0;

  return (
    <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Trends</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">How your tracked metrics are moving over time</p>
        </div>
        <div className="inline-flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {RANGES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                range === option
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {option}d
            </button>
          ))}
        </div>
      </div>

      {!hasAnyMetric ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-10 text-center dark:border-zinc-700 dark:bg-zinc-800/40">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No sleep or screen-time data yet</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Open a day&apos;s log, expand &ldquo;Sleep &amp; screen time&rdquo;, and add your bedtime or Instagram
            minutes. Trends will show up here.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <MetricTrendChart
            title="Bedtime"
            color={BEDTIME_COLOR}
            points={bedtimePoints}
            windowStartKey={startKey}
            windowEndKey={endKey}
            formatValue={latenessToClockLabel}
            yTickLabel={latenessToClockLabel}
          />
          <MetricTrendChart
            title="Instagram"
            color={INSTAGRAM_COLOR}
            points={instagramPoints}
            windowStartKey={startKey}
            windowEndKey={endKey}
            formatValue={formatMinutesShort}
            yTickLabel={formatMinutesShort}
          />
          {customSeries.map(({ metric, points }, index) => {
            const format = (value: number) => formatMetricValue(metric.kind, value, metric.unit);
            return (
              <MetricTrendChart
                key={metric.id}
                title={metric.name}
                color={CUSTOM_COLORS[index % CUSTOM_COLORS.length]}
                points={points}
                windowStartKey={startKey}
                windowEndKey={endKey}
                formatValue={format}
                yTickLabel={format}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
