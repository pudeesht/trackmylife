"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ProfileSettingsProps = {
  userId: string;
  initialUsername: string;
  initialIsPublic: boolean;
  compact?: boolean;
  onUpdated: (next: { username: string; isPublic: boolean }) => void;
};

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export function ProfileSettings({
  userId,
  initialUsername,
  initialIsPublic,
  compact = false,
  onUpdated,
}: ProfileSettingsProps) {
  const [username, setUsername] = useState(initialUsername);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setUsername(initialUsername);
  }, [initialUsername]);

  useEffect(() => {
    setIsPublic(initialIsPublic);
  }, [initialIsPublic]);

  const usernameHint = useMemo(() => {
    if (!username.trim()) {
      return "Use 3-30 chars: lowercase letters, numbers, underscore";
    }

    if (!USERNAME_PATTERN.test(username.trim().toLowerCase())) {
      return "Invalid username format";
    }

    return "Looks good";
  }, [username]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    const normalized = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized)) {
      setError("Username must be 3-30 chars using a-z, 0-9, or _");
      return;
    }

    setIsSaving(true);

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        user_id: userId,
        username: normalized,
        is_public: isPublic,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      if ((upsertError as { code?: string }).code === "23505") {
        setError("This username is already taken");
      } else {
        setError("Could not save profile settings right now");
      }
      setIsSaving(false);
      return;
    }

    setFeedback("Profile settings saved");
    onUpdated({ username: normalized, isPublic });
    setIsSaving(false);
  }

  return (
    <section className={`${compact ? "" : "mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"}`}>
      {compact ? null : (
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Profile settings</p>
      )}
      <form onSubmit={handleSubmit} className={`grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end ${compact ? "" : "mt-3"}`}>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (error) setError(null);
              if (feedback) setFeedback(null);
            }}
            autoComplete="off"
            spellCheck={false}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2"
            placeholder="your_username"
          />
          <p className="mt-1 text-[11px] text-zinc-500">{usernameHint}</p>
        </label>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 sm:justify-end">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => {
                setIsPublic(event.target.checked);
                if (feedback) setFeedback(null);
              }}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            Public profile
          </label>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-zinc-700 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
      {feedback ? <p className="mt-2 text-xs font-medium text-emerald-700">{feedback}</p> : null}
    </section>
  );
}
