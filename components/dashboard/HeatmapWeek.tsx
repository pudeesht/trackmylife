import { getCellStyle, getCellTooltip } from "@/components/dashboard/dashboard-helpers";
import type { DayCell } from "@/components/dashboard/dashboard-types";

type HeatmapWeekProps = {
  cells: DayCell[];
  onCellClick: (cell: DayCell) => void;
};

export function HeatmapWeek({ cells, onCellClick }: HeatmapWeekProps) {
  return (
    <section className="mt-4 transition-all duration-300">
      <h2 className="text-base font-semibold text-zinc-900">Week View</h2>

      <div className="mt-4 grid grid-cols-7 gap-3">
        {cells.map((cell) => {
          const canOpen = Boolean(cell.entry) && !cell.isEmpty;
          const style = getCellStyle(cell);
          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => {
                if (canOpen) onCellClick(cell);
              }}
              title={getCellTooltip(cell)}
              className={`${
                cell.isToday ? "border border-sky-700" : "border border-transparent"
              } flex h-14 w-14 items-center justify-center rounded-lg font-mono text-sm font-semibold transition ${
                canOpen ? "cursor-pointer hover:scale-[1.03]" : "cursor-default"
              } ${cell.entry ? "text-white" : "text-zinc-600"}`}
              style={{
                ...style,
                borderWidth: cell.isToday ? "1.5px" : "1px",
              }}
              aria-label={getCellTooltip(cell)}
            >
              {cell.entry ? cell.entry.score : ""}
            </button>
          );
        })}
      </div>
    </section>
  );
}
