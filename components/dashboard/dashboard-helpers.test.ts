import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatDisplayDate,
  computeStats,
  getRecentEntries,
  buildCurrentWeek,
  getCellTooltip,
  getScoreColor,
  weekStartKey,
} from "./dashboard-helpers";
import type { DailyEntry, DayCell } from "./dashboard-types";

const makeEntry = (entry_date: string, score: number, note: string | null = null): DailyEntry => ({
  id: Number(entry_date.replaceAll("-", "").slice(-6)),
  user_id: "user",
  entry_date,
  score,
  note,
  priority_update: null,
  created_at: `${entry_date}T00:00:00Z`,
  updated_at: `${entry_date}T00:00:00Z`,
});

let localeSpy: { mockRestore: () => void };

beforeEach(() => {
  localeSpy = vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(function (_locales, options) {
    if (options?.weekday === "long") return "Saturday";
    if (options?.weekday === "short") return "Sat";
    if (options?.month === "long") return "March";
    if (options?.month === "short") return "Mar";
    if (options?.year === "2-digit") return "26";
    return "mock";
  });
});

afterEach(() => {
  localeSpy.mockRestore();
});

describe("formatDisplayDate", () => {
  it("formats dates consistently with optional weekday", () => {
    const date = new Date(Date.UTC(2026, 2, 7, 12));

    expect(formatDisplayDate(date)).toBe("7 March '26");
    expect(formatDisplayDate("2026-03-07", { withWeekday: true })).toBe("Saturday, 7 March '26");
  });
});

describe("computeStats", () => {
  it("calculates days logged, average, streak, and green days", () => {
    const entries: DailyEntry[] = [
      makeEntry("2026-03-01", 8),
      makeEntry("2026-03-02", 6),
      makeEntry("2026-03-04", 9),
      makeEntry("2025-12-31", 10),
    ];

    const stats = computeStats(entries, 2026);

    expect(stats.daysLogged).toBe(3);
    expect(stats.averageRating).toBeCloseTo((8 + 6 + 9) / 3);
    expect(stats.bestStreak).toBe(2);
    expect(stats.greenDays).toBe(2);
  });
});

describe("getRecentEntries", () => {
  it("returns the five most recent entries sorted by date", () => {
    const entries: DailyEntry[] = [
      makeEntry("2026-03-05", 5),
      makeEntry("2026-03-02", 6),
      makeEntry("2026-03-07", 7),
      makeEntry("2026-02-28", 4),
      makeEntry("2026-03-01", 8),
      makeEntry("2026-03-06", 9),
    ];

    const recent = getRecentEntries(entries);

    expect(recent).toHaveLength(5);
    expect(recent[0].entry_date).toBe("2026-03-07");
    expect(recent[recent.length - 1].entry_date).toBe("2026-03-01");
  });
});

describe("buildCurrentWeek", () => {
  it("marks today and attaches matching entries", () => {
    const today = new Date(Date.UTC(2026, 2, 6, 12));
    const entries = [makeEntry("2026-03-05", 7), makeEntry("2026-03-06", 5)];

    const cells = buildCurrentWeek(today, entries);

    expect(cells).toHaveLength(7);
    const todayCell = cells.find((cell) => cell.dateKey === "2026-03-06") as DayCell;
    expect(todayCell.isToday).toBe(true);
    expect(todayCell.entry?.score).toBe(5);

    const previousDay = cells.find((cell) => cell.dateKey === "2026-03-05") as DayCell;
    expect(previousDay.entry?.score).toBe(7);
  });
});

describe("getCellTooltip", () => {
  it("returns an empty string for empty cells", () => {
    const tooltip = getCellTooltip({
      dateKey: "empty",
      date: new Date(),
      col: 0,
      row: 0,
      dayNumber: null,
      isEmpty: true,
      isInCurrentYear: true,
      isFuture: false,
      isToday: false,
    });

    expect(tooltip).toBe("");
  });

  it("includes formatted date, score, and truncated note", () => {
    const cell: DayCell = {
      dateKey: "2026-03-07",
      date: new Date(Date.UTC(2026, 2, 7, 12)),
      col: 0,
      row: 0,
      dayNumber: 7,
      isEmpty: false,
      isInCurrentYear: true,
      isFuture: false,
      isToday: false,
      entry: makeEntry(
        "2026-03-07",
        9,
        "A note that is intentionally long to verify truncation at seventy characters for preview"
      ),
    };

    const tooltip = getCellTooltip(cell);
    const [dateLine, scoreLine, noteLine] = tooltip.split("\n");

    expect(dateLine).toBe("Sat, 7 March '26");
    expect(scoreLine).toBe("Score: 9/10");
    expect(noteLine.startsWith("A note that is intentionally long to verify truncation at seventy char")).toBe(true);
    expect(noteLine).toHaveLength(70);
  });
});

describe("getScoreColor", () => {
  it("clamps scores outside the 1-10 range", () => {
    expect(getScoreColor(0)).toBe("#7f0000");
    expect(getScoreColor(11)).toBe("#0d4d3d");
  });
});

describe("weekStartKey", () => {
  it("returns the Sunday date key for any day in the week", () => {
    // 2026-03-06 is a Friday; that week's Sunday is 2026-03-01.
    expect(weekStartKey("2026-03-06")).toBe("2026-03-01");
    // A Sunday maps to itself.
    expect(weekStartKey("2026-03-01")).toBe("2026-03-01");
    // Saturday is the last day of the same week.
    expect(weekStartKey("2026-03-07")).toBe("2026-03-01");
    // Crossing a month boundary stays correct.
    expect(weekStartKey("2026-03-02")).toBe("2026-03-01");
  });
});
