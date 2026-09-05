import { parseNotePoints } from "@/components/dashboard/dashboard-helpers";

type NotePointsProps = {
  note: string | null | undefined;
  emptyLabel?: string;
  className?: string;
};

// Renders a stored note as the bullet list it was written as. A single point
// reads better as a plain sentence than as a one-item list, so it is not
// bulleted.
export function NotePoints({ note, emptyLabel = "No note", className = "" }: NotePointsProps) {
  const points = parseNotePoints(note);

  if (points.length === 0) {
    return <p className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`}>{emptyLabel}</p>;
  }

  if (points.length === 1) {
    return <p className={`text-sm break-words text-zinc-800 dark:text-zinc-200 ${className}`}>{points[0]}</p>;
  }

  return (
    <ul className={`space-y-1 ${className}`}>
      {points.map((point, index) => (
        <li key={index} className="flex gap-2 text-sm text-zinc-800 dark:text-zinc-200">
          <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
          <span className="min-w-0 break-words">{point}</span>
        </li>
      ))}
    </ul>
  );
}
