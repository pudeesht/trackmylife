import type { DashboardStats } from "@/components/dashboard/dashboard-types";

type StatsGridProps = {
  stats: DashboardStats;
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-4">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Days Logged</p>
        <p className="font-mono text-lg font-semibold text-zinc-900">
          {stats.daysLogged}<span className="text-sm text-zinc-500">/365</span>
        </p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Avg Rating</p>
        <p className="font-mono text-lg font-semibold text-zinc-900">{stats.averageRating.toFixed(1)}/10</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Best Streak</p>
        <p className="font-mono text-lg font-semibold text-zinc-900">{stats.bestStreak}d</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Green Days</p>
        <p className="font-mono text-lg font-semibold text-zinc-900">{stats.greenDays}</p>
      </div>
    </section>
  );
}
