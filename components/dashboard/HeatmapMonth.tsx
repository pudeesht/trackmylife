import { getCellStyle, getCellTooltip } from "@/components/dashboard/dashboard-helpers";
import type { DayCell } from "@/components/dashboard/dashboard-types";

type HeatmapMonthProps = {
  monthTitle: string;
  cells: DayCell[];
  onCellClick: (cell: DayCell) => void;
};

export function HeatmapMonth({ monthTitle, cells, onCellClick }: HeatmapMonthProps) {
  return (
    <section className="mt-4 transition-all duration-300">
      <h2 className="text-base font-semibold text-zinc-900">{monthTitle}</h2>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="inline-grid grid-cols-[repeat(7,36px)] gap-1.5">
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
                } flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-medium transition ${
                  canOpen ? "cursor-pointer hover:scale-105" : "cursor-default"
                } ${cell.entry ? "text-white" : "text-zinc-600"}`}
                style={{
                  ...style,
                  borderWidth: cell.isToday ? "1.5px" : "1px",
                }}
                aria-label={getCellTooltip(cell)}
              >
                {cell.dayNumber ?? ""}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
