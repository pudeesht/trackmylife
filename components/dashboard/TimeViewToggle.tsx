import type { ViewMode } from "@/components/dashboard/dashboard-types";

type TimeViewToggleProps = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

const options: ViewMode[] = ["year", "month", "week"];

export function TimeViewToggle({ mode, onChange }: TimeViewToggleProps) {
  return (
    <div className="inline-flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
            mode === option
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
