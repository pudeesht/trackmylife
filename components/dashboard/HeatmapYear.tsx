import { getCellStyle, getCellTooltip } from "@/components/dashboard/dashboard-helpers";
import type { DayCell, YearMonthBlock } from "@/components/dashboard/dashboard-types";

type HeatmapYearProps = {
  monthBlocks: YearMonthBlock[];
  onMonthClick: (monthIndex: number) => void;
  onCellClick: (cell: DayCell) => void;
  readOnly?: boolean;
  showTitle?: boolean;
};

export function HeatmapYear({ monthBlocks, onMonthClick, onCellClick, readOnly = false, showTitle = true }: HeatmapYearProps) {
  return (
    <section className="mt-4">
      {showTitle ? (
        <div className="mb-3">
          <h2 className="text-base font-semibold text-zinc-900">Year View</h2>
        </div>
      ) : null}

      <div>
        <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
          {monthBlocks.map((month) => (
            <article key={month.monthIndex} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!readOnly) {
                    onMonthClick(month.monthIndex);
                  }
                }}
                className={`mb-2 block text-[11px] font-medium text-zinc-500 transition ${
                  readOnly ? "cursor-default" : "hover:text-zinc-900"
                }`}
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
                      } rounded-xs transition ${canOpen ? `cursor-pointer ${readOnly ? "" : "hover:scale-[1.06]"}` : "cursor-default"}`}
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
