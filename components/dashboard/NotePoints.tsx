import { parseNoteBlocks, type NoteBlock } from "@/components/dashboard/dashboard-helpers";

type NotePointsProps = {
  note: string | null | undefined;
  emptyLabel?: string;
  className?: string;
};

type NoteGroup = { kind: "points"; items: string[] } | { kind: "text"; text: string };

// A run of dash-prefixed lines is one list; every other line is its own
// paragraph. Grouping matters: three points in a row should read as one list,
// not as three lists stacked on top of each other.
function groupNoteBlocks(blocks: NoteBlock[]): NoteGroup[] {
  const groups: NoteGroup[] = [];

  for (const block of blocks) {
    if (block.kind === "text") {
      groups.push({ kind: "text", text: block.text });
      continue;
    }

    const last = groups[groups.length - 1];
    if (last && last.kind === "points") {
      last.items.push(block.text);
    } else {
      groups.push({ kind: "points", items: [block.text] });
    }
  }

  return groups;
}

// Renders a daily note the way it was written: paragraphs stay paragraphs, and
// lines that open with a dash become bullets.
export function NotePoints({ note, emptyLabel = "No note", className = "" }: NotePointsProps) {
  const groups = groupNoteBlocks(parseNoteBlocks(note));

  if (groups.length === 0) {
    return <p className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`}>{emptyLabel}</p>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {groups.map((group, groupIndex) =>
        group.kind === "points" ? (
          <ul key={groupIndex} className="space-y-1">
            {group.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={groupIndex} className="text-sm break-words text-zinc-800 dark:text-zinc-200">
            {group.text}
          </p>
        )
      )}
    </div>
  );
}
