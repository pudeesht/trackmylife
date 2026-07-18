type StreakBadgeProps = {
  currentStreak: number;
  bestStreak: number;
};

export function StreakBadge({ currentStreak, bestStreak }: StreakBadgeProps) {
  const isActive = currentStreak > 0;

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
        isActive
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800"
      }`}
    >
      <span className={`text-base ${isActive ? "" : "opacity-30 grayscale"}`} aria-hidden>
        🔥
      </span>
      <span
        className={`text-sm font-semibold ${
          isActive ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {isActive ? `${currentStreak} day${currentStreak === 1 ? "" : "s"} streak` : "No active streak"}
      </span>
      {bestStreak > 0 ? <span className="text-xs text-zinc-400 dark:text-zinc-500">· best {bestStreak}d</span> : null}
    </div>
  );
}
