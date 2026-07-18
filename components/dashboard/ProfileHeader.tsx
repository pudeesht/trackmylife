type ProfileHeaderProps = {
  username: string;
  isPublic: boolean;
  onLogout: () => Promise<void>;
};

function getInitials(username: string): string {
  const parts = username.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export function ProfileHeader({ username, isPublic, onLogout }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-zinc-900 text-xs font-semibold text-white">
        {getInitials(username)}
      </div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{username}</p>
      <span
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
          isPublic
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        }`}
      >
        {isPublic ? "Public" : "Private"}
      </span>

      <button
        onClick={onLogout}
        className="ml-1 rounded-lg px-2.5 py-1 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        Logout
      </button>
    </div>
  );
}
