"use client";

import { FormEvent, useEffect, useState } from "react";

type WeeklyPriorityCardProps = {
  weekLabel: string;
  priority: string | null;
  isSaving: boolean;
  onSave: (text: string) => void;
};

export function WeeklyPriorityCard({ weekLabel, priority, isSaving, onSave }: WeeklyPriorityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(priority ?? "");

  // Keep the draft in sync when the stored priority changes (e.g. after save/reload).
  useEffect(() => {
    setDraft(priority ?? "");
    setIsEditing(false);
  }, [priority]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    onSave(trimmed);
  }

  const isEmpty = !priority;
  const showForm = isEmpty || isEditing;

  return (
    <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          This week&apos;s focus
        </p>
        <span className="text-[11px] text-emerald-600/70">{weekLabel}</span>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={120}
            autoFocus={isEditing}
            placeholder="e.g. Finish the auth flow"
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2"
          />
          <button
            type="submit"
            disabled={isSaving || !draft.trim()}
            className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : isEmpty ? "Add" : "Save"}
          </button>
          {!isEmpty ? (
            <button
              type="button"
              onClick={() => {
                setDraft(priority ?? "");
                setIsEditing(false);
              }}
              className="shrink-0 rounded-lg px-2 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              Cancel
            </button>
          ) : null}
        </form>
      ) : (
        <div className="mt-1 flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-zinc-900">
            <span aria-hidden>🎯 </span>
            {priority}
          </p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            Edit
          </button>
        </div>
      )}
    </section>
  );
}
