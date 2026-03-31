import type { DailyEntry } from "@/components/dashboard/dashboard-types";

type BestWorstSectionProps = {
  best: DailyEntry[];
  worst: DailyEntry[];
  onOpen: (entry: DailyEntry) => void;
};

function EntryList({ title, items, onOpen }: { title: string; items: DailyEntry[]; onOpen: (entry: DailyEntry) => void }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {items.length === 0 ? <p className="mt-3 text-sm text-zinc-600">No data yet.</p> : null}
      <div className="mt-3 space-y-2">
        {items.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onOpen(entry)}
            className="flex w-full items-start justify-between rounded-lg border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900">{new Date(entry.entry_date).toLocaleDateString()}</p>
              <p className="mt-1 text-xs text-zinc-600">{(entry.note ?? "No note").slice(0, 70)}</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700">
              {entry.score}/10
            </span>
          </button>
        ))}
      </div>
    </article>
  );
}

export function BestWorstSection({ best, worst, onOpen }: BestWorstSectionProps) {
  return (
    <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <EntryList title="Best Days" items={best} onOpen={onOpen} />
      <EntryList title="Worst Days" items={worst} onOpen={onOpen} />
    </section>
  );
}
