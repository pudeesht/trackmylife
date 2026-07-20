import { CHANGELOG, type ChangelogTag } from "@/components/changelog/changelog-data";

const TAG_STYLES: Record<ChangelogTag, string> = {
  new: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  improved: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  fixed: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

const TAG_LABELS: Record<ChangelogTag, string> = {
  new: "New",
  improved: "Improved",
  fixed: "Fixed",
};

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WhatsNewList() {
  if (CHANGELOG.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">No updates yet.</p>;
  }

  return (
    <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
      {CHANGELOG.map((entry) => (
        <article key={entry.id} className="border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_STYLES[entry.tag]}`}
            >
              {TAG_LABELS[entry.tag]}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatDate(entry.date)}</span>
          </div>
          <h4 className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{entry.title}</h4>
          {entry.description ? (
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{entry.description}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
