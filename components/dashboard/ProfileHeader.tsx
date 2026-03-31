type ProfileHeaderProps = {
  username: string;
  onLogout: () => Promise<void>;
};

function getInitials(username: string): string {
  const parts = username.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export function ProfileHeader({ username, onLogout }: ProfileHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
          {getInitials(username)}
        </div>
        <p className="text-sm font-medium text-zinc-900">{username}</p>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          Public
        </span>
      </div>

      <button
        onClick={onLogout}
        className="rounded-md px-2.5 py-1 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
      >
        Logout
      </button>
    </header>
  );
}
