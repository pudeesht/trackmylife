"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type PublicProfileSearchProps = {
  currentUsername: string;
};

export function PublicProfileSearch({ currentUsername }: PublicProfileSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const username = query.trim().toLowerCase();
    if (!username) {
      setError(null);
      return;
    }

    if (username === currentUsername.trim().toLowerCase()) {
      router.push("/dashboard");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      if (response.status === 404) {
        setError("No user found");
        setIsSearching(false);
        return;
      }

      if (!response.ok) {
        setError("Search unavailable right now");
        setIsSearching(false);
        return;
      }

      router.push(`/${username}`);
    } catch {
      setError("Search unavailable right now");
      setIsSearching(false);
      return;
    }

    setIsSearching(false);
  }

  return (
    <div className="flex max-w-sm flex-col">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Search username"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none ring-zinc-300 transition focus:ring-2"
          aria-label="Search username"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
