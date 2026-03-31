export type DailyEntry = {
  id: number;
  user_id: string;
  entry_date: string;
  score: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type ViewMode = "year" | "month" | "week";

export type DayCell = {
  dateKey: string;
  date: Date;
  col: number;
  row: number;
  dayNumber: number | null;
  isEmpty: boolean;
  isInCurrentYear: boolean;
  isFuture: boolean;
  isToday: boolean;
  entry?: DailyEntry;
};

export type YearMonthBlock = {
  label: string;
  monthIndex: number;
  weekCount: number;
  cells: DayCell[];
};

export type DashboardStats = {
  daysLogged: number;
  averageRating: number;
  bestStreak: number;
  greenDays: number;
};
