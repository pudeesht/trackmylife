import type { DailyEntry, DashboardStats, DayCell, YearMonthBlock } from "@/components/dashboard/dashboard-types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(date = new Date()): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function getEntryMap(entries: DailyEntry[]): Map<string, DailyEntry> {
  return new Map(entries.map((entry) => [entry.entry_date, entry]));
}

export function getScoreColor(score: number): string {
  const colors: Record<number, string> = {
    1: "#7f0000",
    2: "#c0392b",
    3: "#e74c3c",
    4: "#e67e22",
    5: "#f39c12",
    6: "#f1c40f",
    7: "#90ee90",
    8: "#27ae60",
    9: "#1abc9c",
    10: "#0d4d3d",
  };
  return colors[Math.max(1, Math.min(10, score))] || colors[5];
}

export function getCellStyle(cell: DayCell): { backgroundColor: string; opacity: number } {
  if (cell.isEmpty) {
    return { backgroundColor: "transparent", opacity: 1 };
  }

  if (cell.entry) {
    return { backgroundColor: getScoreColor(cell.entry.score), opacity: 1 };
  }

  return {
    backgroundColor: "var(--muted, #94a3b8)",
    opacity: cell.isFuture ? 0.3 : 0.6,
  };
}

export function getCellTooltip(cell: DayCell): string {
  if (cell.isEmpty) {
    return "";
  }

  const dateLabel = cell.date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!cell.entry) {
    return `${dateLabel}\nNo entry logged`;
  }

  const note = (cell.entry.note ?? "").trim();
  const preview = note.length ? note.slice(0, 70) : "No note";
  return `${dateLabel}\nScore: ${cell.entry.score}/10\n${preview}`;
}

export function buildYearMonthBlocks(year: number, entries: DailyEntry[], today = new Date()): YearMonthBlock[] {
  const entryMap = getEntryMap(entries);
  const todayKey = toDateKey(today);
  const blocks: YearMonthBlock[] = [];

  for (let m = 0; m < 12; m += 1) {
    const monthStart = new Date(year, m, 1);
    const firstDow = monthStart.getDay();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const weekCount = Math.ceil((firstDow + daysInMonth) / 7);

    const monthCells: DayCell[] = [];
    for (let week = 0; week < weekCount; week += 1) {
      for (let row = 0; row < 7; row += 1) {
        const dayNumber = week * 7 + row - firstDow + 1;

        if (dayNumber < 1 || dayNumber > daysInMonth) {
          monthCells.push({
            dateKey: `empty-month-${year}-${m}-${week}-${row}`,
            date: monthStart,
            col: week,
            row,
            dayNumber: null,
            isEmpty: true,
            isInCurrentYear: true,
            isFuture: false,
            isToday: false,
          });
          continue;
        }

        const date = new Date(year, m, dayNumber);
        const dateKey = toDateKey(date);
        monthCells.push({
          dateKey,
          date,
          col: week,
          row,
          dayNumber,
          isEmpty: false,
          isInCurrentYear: true,
          isFuture: dateKey > todayKey,
          isToday: dateKey === todayKey,
          entry: entryMap.get(dateKey),
        });
      }
    }

    blocks.push({
      label: monthStart.toLocaleDateString(undefined, { month: "short" }),
      monthIndex: m,
      weekCount,
      cells: monthCells,
    });
  }

  return blocks;
}

export function buildYearGrid(year: number, entries: DailyEntry[], today = new Date()): {
  cells: DayCell[];
  monthLabels: never[];
} {
  const blocks = buildYearMonthBlocks(year, entries, today);
  const cells = blocks.flatMap((block) => block.cells);
  return { cells, monthLabels: [] };
}

export function buildMonthGrid(year: number, month: number, entries: DailyEntry[], today = new Date()): DayCell[] {
  const entryMap = getEntryMap(entries);
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDay = first.getDay();
  const daysInMonth = last.getDate();
  const todayKey = toDateKey(today);

  const cells: DayCell[] = [];
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - firstDay + 1;
    const row = Math.floor(index / 7);
    const col = index % 7;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push({
        dateKey: `empty-month-${year}-${month}-${index}`,
        date: new Date(year, month, 1),
        col,
        row,
        dayNumber: null,
        isEmpty: true,
        isInCurrentYear: true,
        isFuture: false,
        isToday: false,
      });
      continue;
    }

    const date = new Date(year, month, dayNumber);
    const dateKey = toDateKey(date);
    cells.push({
      dateKey,
      date,
      col,
      row,
      dayNumber,
      isEmpty: false,
      isInCurrentYear: true,
      isFuture: dateKey > todayKey,
      isToday: dateKey === todayKey,
      entry: entryMap.get(dateKey),
    });
  }

  return cells;
}

export function buildCurrentWeek(today: Date, entries: DailyEntry[]): DayCell[] {
  const entryMap = getEntryMap(entries);
  const start = startOfWeek(today);
  const todayKey = toDateKey(today);

  const cells: DayCell[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(start, i);
    const dateKey = toDateKey(date);
    cells.push({
      dateKey,
      date,
      col: i,
      row: 0,
      dayNumber: date.getDate(),
      isEmpty: false,
      isInCurrentYear: true,
      isFuture: dateKey > todayKey,
      isToday: dateKey === todayKey,
      entry: entryMap.get(dateKey),
    });
  }

  return cells;
}

export function computeStats(entries: DailyEntry[], year: number): DashboardStats {
  const yearEntries = entries.filter((entry) => new Date(entry.entry_date).getFullYear() === year);
  const daysLogged = yearEntries.length;
  const total = yearEntries.reduce((sum, entry) => sum + entry.score, 0);
  const averageRating = daysLogged ? total / daysLogged : 0;
  const greenDays = yearEntries.filter((entry) => entry.score >= 7).length;

  const sortedDates = [...new Set(yearEntries.map((entry) => entry.entry_date))].sort();
  let bestStreak = 0;
  let currentStreak = 0;
  let previous: Date | null = null;

  sortedDates.forEach((dateKey) => {
    const current = fromDateKey(dateKey);
    if (!previous) {
      currentStreak = 1;
      bestStreak = Math.max(bestStreak, currentStreak);
      previous = current;
      return;
    }

    const diffDays = Math.round((current.getTime() - previous.getTime()) / DAY_MS);
    currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
    bestStreak = Math.max(bestStreak, currentStreak);
    previous = current;
  });

  return {
    daysLogged,
    averageRating,
    bestStreak,
    greenDays,
  };
}

export function getBestAndWorst(entries: DailyEntry[]): { best: DailyEntry[]; worst: DailyEntry[] } {
  const best = [...entries]
    .sort((a, b) => (b.score - a.score) || a.entry_date.localeCompare(b.entry_date))
    .slice(0, 3);

  const worst = [...entries]
    .sort((a, b) => (a.score - b.score) || a.entry_date.localeCompare(b.entry_date))
    .slice(0, 3);

  return { best, worst };
}

export function getRecentEntries(entries: DailyEntry[]): DailyEntry[] {
  return [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date)).slice(0, 5);
}
