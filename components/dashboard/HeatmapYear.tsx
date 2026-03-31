import { getCellStyle, getCellTooltip } from "@/components/dashboard/dashboard-helpers";
import type { DayCell, YearMonthBlock } from "@/components/dashboard/dashboard-types";

type HeatmapYearProps = {
  monthBlocks: YearMonthBlock[];
  onMonthClick: (monthIndex: number) => void;
  onCellClick: (cell: DayCell) => void;
};

export function HeatmapYear({ monthBlocks, onMonthClick, onCellClick }: HeatmapYearProps) {
  return (
    <section className="mt-4">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-zinc-900">Year View</h2>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-flex min-w-max items-start gap-1.5">
          {monthBlocks.map((month) => (
            <article key={month.monthIndex} className="flex-shrink-0">
              <button
                type="button"
                onClick={() => onMonthClick(month.monthIndex)}
                className="mb-2 block text-[11px] font-medium text-zinc-500 transition hover:text-zinc-900"
              >
                {month.label}
              </button>

              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${month.weekCount}, 11px)`,
                  gridTemplateRows: "repeat(7, 11px)",
                  gap: "2.5px",
                }}
              >
                {month.cells.map((cell) => {
                  const canOpen = Boolean(cell.entry) && !cell.isEmpty;
                  const style = getCellStyle(cell);
                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      onClick={() => {
                        if (canOpen) {
                          onCellClick(cell);
                        }
                      }}
                      title={getCellTooltip(cell)}
                      className={`${
                        cell.isToday ? "border border-sky-700" : "border border-transparent"
                      } rounded-[2px] transition ${canOpen ? "cursor-pointer hover:scale-[1.06]" : "cursor-default"}`}
                      style={{
                        ...style,
                        borderWidth: cell.isToday ? "1.5px" : "1px",
                        gridColumnStart: cell.col + 1,
                        gridRowStart: cell.row + 1,
                      }}
                      aria-label={getCellTooltip(cell)}
                    />
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
