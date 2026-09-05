"use client";

import { useId, useState } from "react";

import { parseNotePoints } from "@/components/dashboard/dashboard-helpers";

type PriorityChipProps = {
  /** The week's priority, stored as up to three points, one per line. */
  priority: string | null | undefined;
  label?: string;
  className?: string;
};

// The weekly priority can be three points, which is too much to spell out
// everywhere it is referenced. Everywhere but the dashboard card it is a single
// "Priority" keyword that expands in place to the full list.
export function PriorityChip({ priority, label = "Priority", className = "" }: PriorityChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();
  const points = parseNotePoints(priority);

  if (points.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={listId}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
      >
        <span aria-hidden>🎯</span>
        {label}
        <span className="rounded-full bg-emerald-200/70 px-1.5 text-[10px] font-bold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
          {points.length}
        </span>
        <span aria-hidden className={`text-[9px] transition-transform ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen ? (
        <ol
          id={listId}
          className="mt-2 space-y-1 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/40"
        >
          {points.map((point, index) => (
            <li key={index} className="flex gap-2 text-sm text-zinc-800 dark:text-zinc-200">
              <span
                aria-hidden
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white"
              >
                {index + 1}
              </span>
              <span className="min-w-0 break-words">{point}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
