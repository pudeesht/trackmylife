import { getScoreColor } from "@/components/dashboard/dashboard-helpers";
import type { DailyEntry } from "@/components/dashboard/dashboard-types";

type RecentEntriesListProps = {
  entries: DailyEntry[];
  onOpen: (entry: DailyEntry) => void;
};

export function RecentEntriesList({ entries, onOpen }: RecentEntriesListProps) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold text-zinc-900">Recent entries</h3>
      <div className="mt-2 space-y-2">
        {entries.length === 0 ? <p className="text-sm text-zinc-500">No recent entries yet.</p> : null}

        {entries.map((entry) => {
          const color = getScoreColor(entry.score);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpen(entry)}
              className="flex w-full items-start justify-between rounded-md px-1 py-2 text-left hover:bg-zinc-50"
            >
              <div className="flex items-start gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{new Date(entry.entry_date).toLocaleDateString()}</p>
                  <p className="mt-0.5 max-w-52.5 truncate text-xs text-zinc-600">{(entry.note ?? "No note").slice(0, 90)}</p>
                </div>
              </div>
              <span
                className="rounded px-2 py-0.5 text-xs font-semibold text-white"
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
