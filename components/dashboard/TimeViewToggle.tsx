import type { ViewMode } from "@/components/dashboard/dashboard-types";

type TimeViewToggleProps = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

const options: ViewMode[] = ["year", "month", "week"];

export function TimeViewToggle({ mode, onChange }: TimeViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-zinc-100 p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
            mode === option ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
