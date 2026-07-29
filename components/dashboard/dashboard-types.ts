export type DailyEntry = {
  id: number;
  user_id: string;
  entry_date: string;
  score: number;
  note: string | null;
  priority_update: string | null;
  bedtime: string | null;
  instagram_minutes: number | null;
  created_at: string;
  updated_at: string;
};

// v1 supports number & duration only. Time-of-day is future scope (see the
// bedtime lateness math in dashboard-helpers.ts) — do not add it here casually.
export type MetricKind = "number" | "duration";

// A user's custom metric definition. Mirrors public.metric_definitions.
export type MetricDefinition = {
  id: number;
  user_id: string;
  name: string;
  unit: string | null;
  kind: MetricKind;
  is_public: boolean;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

// A single logged value for a custom metric on a given day. Mirrors
// public.metric_values. `value` is always numeric; `kind` on the definition
// governs how it is rendered.
export type MetricValue = {
  id: number;
  user_id: string;
  metric_id: number;
  entry_date: string;
  value: number;
  created_at: string;
  updated_at: string;
};

export type WeeklyPriority = {
  id: number;
  user_id: string;
  week_start: string;
  priority: string;
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
