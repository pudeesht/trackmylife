"use client";

import React, { useRef } from "react";
import { flushSync } from "react-dom";

type PointsEditorProps = {
  points: string[];
  onChange: (points: string[]) => void;
  maxPoints: number;
  /** Characters left in the parent's shared budget for the serialized text. */
  charsLeft: number;
  firstPlaceholder: string;
  nextPlaceholder: string;
  /** Singular noun for the add button and the per-row aria labels. */
  itemNoun: string;
  tone?: "zinc" | "emerald";
  hint?: string;
};

const TONES = {
  zinc: {
    bullet: "bg-zinc-400 dark:bg-zinc-500",
    input: "border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
    add: "text-emerald-700 dark:text-emerald-400",
  },
  emerald: {
    bullet: "bg-emerald-500 dark:bg-emerald-400",
    input:
      "border-emerald-200 bg-white dark:border-emerald-900 dark:bg-zinc-800 dark:text-zinc-100",
    add: "text-emerald-700 dark:text-emerald-400",
  },
} as const;

// A point is a textarea so a long one wraps instead of scrolling sideways, and
// each row is grown to fit its own content so the list has no inner scrollbars.
// Called from the ref callback (which re-runs on every render, covering pasted
// and re-seeded text) and on input, so a row never lags behind what it holds.
function autoGrow(element: HTMLTextAreaElement | null) {
  if (!element) {
    return;
  }
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

// A bullet list you type into: one textarea per point, Enter starts the next
// point, backspace on an empty point removes it. Used by the weekly priority,
// where the list is capped and each point is its own commitment - the daily
// note is freeform text instead (see LogPanel).
export function PointsEditor({
  points,
  onChange,
  maxPoints,
  charsLeft,
  firstPlaceholder,
  nextPlaceholder,
  itemNoun,
  tone = "zinc",
  hint,
}: PointsEditorProps) {
  const styles = TONES[tone];

  const inputs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Moves the caret to the row at `index` after the list changes shape (Enter
  // added a row, backspace removed one, "Add" appended one). The change is
  // flushed first so the row being focused is on screen to receive it.
  function changeAndFocus(next: string[], index: number) {
    flushSync(() => onChange(next));
    inputs.current[Math.max(0, Math.min(index, next.length - 1))]?.focus();
  }

  function updatePoint(index: number, value: string) {
    // Nothing may type a newline into a point (Enter is intercepted below), but
    // pasted multi-line text can. Split it so one pasted line is one point,
    // rather than letting a newline silently become a point on the next load.
    if (value.includes("\n")) {
      const pasted = value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const merged = [...points.slice(0, index), ...(pasted.length ? pasted : [""]), ...points.slice(index + 1)];
      changeAndFocus(merged.slice(0, maxPoints), Math.min(index + Math.max(pasted.length, 1) - 1, maxPoints - 1));
      return;
    }

    onChange(points.map((point, i) => (i === index ? value : point)));
  }

  function addPointAfter(index: number) {
    if (points.length >= maxPoints) {
      return;
    }
    changeAndFocus([...points.slice(0, index + 1), "", ...points.slice(index + 1)], index + 1);
  }

  function removePoint(index: number) {
    const next = points.filter((_, i) => i !== index);
    changeAndFocus(next.length ? next : [""], Math.max(0, index - 1));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (event.key === "Enter") {
      // Enter starts the next point instead of submitting the form.
      event.preventDefault();
      addPointAfter(index);
      return;
    }

    if (event.key === "Backspace" && points[index] === "" && points.length > 1) {
      event.preventDefault();
      removePoint(index);
    }
  }

  return (
    <>
      <ul className="mt-1.5 space-y-1.5">
        {points.map((point, index) => (
          <li key={index} className="flex items-start gap-2">
            <span aria-hidden className={`mt-4 h-1 w-1 shrink-0 rounded-full ${styles.bullet}`} />
            <textarea
              ref={(element) => {
                inputs.current[index] = element;
                autoGrow(element);
              }}
              rows={1}
              value={point}
              onChange={(event) => {
                autoGrow(event.currentTarget);
                updatePoint(index, event.target.value);
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              // The budget is shared across points, so any one row may only
              // grow into what is left of the whole allowance.
              maxLength={point.length + charsLeft}
              aria-label={`${itemNoun} ${index + 1}`}
              placeholder={index === 0 ? firstPlaceholder : nextPlaceholder}
              className={`min-w-0 flex-1 resize-none overflow-hidden rounded-lg border px-2.5 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2 ${styles.input}`}
            />
            <button
              type="button"
              onClick={() => removePoint(index)}
              aria-label={`Remove ${itemNoun.toLowerCase()} ${index + 1}`}
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
          onClick={() => addPointAfter(points.length - 1)}
          disabled={points.length >= maxPoints}
          className={`text-xs font-semibold underline-offset-2 transition hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline dark:disabled:text-zinc-600 ${styles.add}`}
        >
          + Add {itemNoun.toLowerCase()}
        </button>
        {hint ? <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p> : null}
      </div>
    </>
  );
}
