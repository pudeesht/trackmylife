import { formatDisplayDate, formatNoteInline, getScoreColor } from "@/components/dashboard/dashboard-helpers";
import type { DailyEntry } from "@/components/dashboard/dashboard-types";

type RecentEntriesListProps = {
  entries: DailyEntry[];
  onOpen: (entry: DailyEntry) => void;
};

export function RecentEntriesList({ entries, onOpen }: RecentEntriesListProps) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent entries</h3>
      <div className="mt-2 space-y-1.5">
        {entries.length === 0 ? <p className="text-sm text-zinc-500 dark:text-zinc-400">No recent entries yet.</p> : null}

        {entries.map((entry) => {
          const color = getScoreColor(entry.score);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpen(entry)}
              className="flex w-full items-start justify-between rounded-xl px-2.5 py-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <div className="flex items-start gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatDisplayDate(entry.entry_date)}</p>
                  <p className="mt-0.5 max-w-52.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{formatNoteInline(entry.note, 90) || "No note"}</p>
                </div>
              </div>
              <span
                className="rounded-md px-2 py-0.5 text-xs font-semibold text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                {entry.score}/10
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
