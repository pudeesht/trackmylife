"use client";

import { useMemo, useState } from "react";
import {
  bedtimeToLatenessMinutes,
  formatMinutesShort,
  latenessToClockLabel,
  toDateKey,
} from "@/components/dashboard/dashboard-helpers";
import { MetricTrendChart, type TrendPoint } from "@/components/dashboard/MetricTrendChart";
import type { DailyEntry } from "@/components/dashboard/dashboard-types";

type TrendsCardProps = {
  entries: DailyEntry[];
  today: Date;
};

const RANGES = [30, 90] as const;
type Range = (typeof RANGES)[number];

const BEDTIME_COLOR = "#6366f1"; // indigo — sleep/night
const INSTAGRAM_COLOR = "#f43f5e"; // rose — screen time

function windowStart(today: Date, days: number): string {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
  return toDateKey(start);
}

export function TrendsCard({ entries, today }: TrendsCardProps) {
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

  const hasAnyMetric = entries.some((e) => e.bedtime != null || e.instagram_minutes != null);

  return (
    <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Trends</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">How your bedtime &amp; Instagram time are moving</p>
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
        </div>
      )}
    </section>
  );
}
