"use client";

import { useEffect, useRef, useState } from "react";
import { formatDisplayDate } from "@/components/dashboard/dashboard-helpers";

export type TrendPoint = { dateKey: string; value: number };

type MetricTrendChartProps = {
  title: string;
  color: string;
  points: TrendPoint[]; // non-null values, ascending by date, already windowed
  windowStartKey: string;
  windowEndKey: string;
  formatValue: (value: number) => string; // tooltip + latest value
  yTickLabel: (value: number) => string; // axis tick label
};

const DAY_MS = 86_400_000;

function keyToUtc(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((keyToUtc(toKey) - keyToUtc(fromKey)) / DAY_MS);
}

// Measures the container so the SVG renders at true pixel size (crisp, no distortion).
function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

export function MetricTrendChart({
  title,
  color,
  points,
  windowStartKey,
  windowEndKey,
  formatValue,
  yTickLabel,
}: MetricTrendChartProps) {
  const { ref, width } = useContainerWidth();
  const [hovered, setHovered] = useState<number | null>(null);

  const height = 150;
  const padLeft = 58;
  const padRight = 12;
  const padTop = 14;
  const padBottom = 22;
  const plotW = Math.max(0, width - padLeft - padRight);
  const plotH = height - padTop - padBottom;

  const values = points.map((p) => p.value);
  const dataMin = values.length ? Math.min(...values) : 0;
  const dataMax = values.length ? Math.max(...values) : 1;
  const flat = dataMin === dataMax;
  const padY = flat ? Math.max(30, Math.abs(dataMin) * 0.1 || 30) : (dataMax - dataMin) * 0.12;
  const scaleMin = dataMin - padY;
  const scaleMax = dataMax + padY;

  const totalDays = Math.max(1, daysBetween(windowStartKey, windowEndKey));

  const x = (dateKey: string) => padLeft + (daysBetween(windowStartKey, dateKey) / totalDays) * plotW;
  const y = (value: number) => padTop + (1 - (value - scaleMin) / (scaleMax - scaleMin || 1)) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.dateKey).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(" ");

  const latest = points.length ? points[points.length - 1] : null;
  const hoveredPoint = hovered != null ? points[hovered] : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {latest ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            latest <span className="font-semibold" style={{ color }}>{formatValue(latest.value)}</span>
          </p>
        ) : null}
      </div>

      <div ref={ref} className="relative mt-2" style={{ height }}>
        {points.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-800/40">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">No data in this range</p>
          </div>
        ) : width > 0 ? (
          <svg width={width} height={height} role="img" aria-label={`${title} trend`}>
            {/* recessive y gridlines + labels at data min/max */}
            {[dataMax, dataMin].map((tickValue, i) => (
              <g key={i}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y(tickValue)}
                  y2={y(tickValue)}
                  strokeWidth={1}
                  className="stroke-zinc-200 dark:stroke-zinc-700"
                />
                <text x={padLeft - 8} y={y(tickValue) + 3} textAnchor="end" className="fill-zinc-400 text-[10px] dark:fill-zinc-500">
                  {yTickLabel(tickValue)}
                </text>
              </g>
            ))}

            {points.length > 1 ? (
              <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            ) : null}

            {points.map((p, i) => (
              <circle key={p.dateKey} cx={x(p.dateKey)} cy={y(p.value)} r={hovered === i ? 4.5 : 3} fill={color} />
            ))}

            {/* larger invisible hit targets for hover */}
            {points.map((p, i) => (
              <circle
                key={`hit-${p.dateKey}`}
                cx={x(p.dateKey)}
                cy={y(p.value)}
                r={10}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((cur) => (cur === i ? null : cur))}
              />
            ))}
          </svg>
        ) : null}

        {hoveredPoint ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white shadow-lg"
            style={{ left: x(hoveredPoint.dateKey), top: y(hoveredPoint.value) - 8 }}
          >
            <span className="font-semibold">{formatValue(hoveredPoint.value)}</span>
            <span className="ml-1 text-zinc-300">{formatDisplayDate(hoveredPoint.dateKey)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
