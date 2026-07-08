"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PublicProfileSearchProps = {
  currentUsername: string;
  onDone?: () => void;
};

type SearchUserResponse = {
  query: string;
  results: Array<{ username: string }>;
};

function normalizeUsernameInput(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
}

export function PublicProfileSearch({ currentUsername, onDone }: PublicProfileSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<Array<{ username: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);

  const normalizedQuery = useMemo(() => normalizeUsernameInput(query), [query]);

  useEffect(() => {
    if (!normalizedQuery) {
      setMatches([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(`/api/search/users?query=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setMatches([]);
          setError("Search unavailable right now");
          setIsSearching(false);
          return;
        }

        const payload = (await response.json()) as SearchUserResponse;
        setMatches(payload.results ?? []);
        setIsSearching(false);
      } catch (fetchError) {
        if ((fetchError as { name?: string }).name === "AbortError") {
          return;
        }
        setMatches([]);
        setError("Search unavailable right now");
        setIsSearching(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [normalizedQuery]);

  function navigateTo(username: string) {
    const normalized = normalizeUsernameInput(username);
    if (!normalized) return;

    if (normalized === currentUsername.trim().toLowerCase()) {
      router.push("/dashboard");
      onDone?.();
      return;
    }

    router.push(`/${normalized}`);
    onDone?.();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const username = normalizedQuery;
    if (!username) {
      setError(null);
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      if (response.status === 404) {
        if (matches.length) {
          setError("No exact match. Pick from suggestions.");
        } else {
          setError("No user found");
        }
        return;
      }

      if (!response.ok) {
        setError("Search unavailable right now");
        return;
      }

      navigateTo(username);
    } catch {
      setError("Search unavailable right now");
      return;
    }
  }

  return (
    <div className="relative flex max-w-sm flex-col">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (error) setError(null);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
          placeholder="Search username"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2"
          aria-label="Search username"
        />
        <button
          type="submit"
          disabled={Boolean(!normalizedQuery)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
        >
          Go
        </button>
      </form>

      {isOpen && normalizedQuery ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
          {isSearching ? <p className="px-2 py-1.5 text-xs text-zinc-500">Searching...</p> : null}

          {!isSearching && matches.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-zinc-500">No matches</p>
          ) : null}

          {!isSearching ? (
            <div className="flex max-h-56 flex-col overflow-y-auto">
              {matches.map((match) => (
                <button
                  key={match.username}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    navigateTo(match.username);
                  }}
                  className="rounded-lg px-2 py-2 text-left text-sm text-zinc-800 transition hover:bg-zinc-50"
                >
                  {match.username}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
