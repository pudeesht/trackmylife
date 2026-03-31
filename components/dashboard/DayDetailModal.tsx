import { getScoreColor } from "@/components/dashboard/dashboard-helpers";
import type { DailyEntry } from "@/components/dashboard/dashboard-types";

type DayDetailModalProps = {
  entry: DailyEntry | null;
  onClose: () => void;
};

export function DayDetailModal({ entry, onClose }: DayDetailModalProps) {
  if (!entry) {
    return null;
  }

  const scoreColor = getScoreColor(entry.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Day detail</p>
            <h3 className="mt-1 text-base font-semibold text-zinc-900">
              {new Date(entry.entry_date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Close
          </button>
        </div>

        <div className="mt-5 flex items-end gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-bold text-white"
            style={{ backgroundColor: scoreColor }}
          >
            {entry.score}
          </div>
          <p className="text-sm text-zinc-600">out of 10</p>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Note</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
            {entry.note?.trim().length ? entry.note : "No note added for this day."}
          </p>
        </div>
      </div>
    </div>
  );
}
