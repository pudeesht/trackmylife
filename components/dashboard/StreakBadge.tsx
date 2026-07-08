type StreakBadgeProps = {
  currentStreak: number;
  bestStreak: number;
};

export function StreakBadge({ currentStreak, bestStreak }: StreakBadgeProps) {
  const isActive = currentStreak > 0;

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
        isActive ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <span className={`text-base ${isActive ? "" : "opacity-30 grayscale"}`} aria-hidden>
        🔥
      </span>
      <span className={`text-sm font-semibold ${isActive ? "text-emerald-700" : "text-zinc-500"}`}>
        {isActive ? `${currentStreak} day${currentStreak === 1 ? "" : "s"} streak` : "No active streak"}
      </span>
      {bestStreak > 0 ? <span className="text-xs text-zinc-400">· best {bestStreak}d</span> : null}
    </div>
  );
}
