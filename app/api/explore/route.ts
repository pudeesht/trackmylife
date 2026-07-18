import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/ratelimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PAGE_SIZE = 30;

type ExploreRow = {
  username: string;
  entries_last_7: number;
  total_entries: number;
  last_entry_date: string;
  avg_score_last_7: number | null;
  recent_days: Array<{ date: string; score: number }>;
};

function parseOffset(value: string | null): number {
  const parsed = Number.parseInt(value ?? "0", 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.min(parsed, 300);
}

export async function GET(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ message: "Server explore API is not configured" }, { status: 500 });
  }

  const { ok } = await checkRateLimit(request, "explore");
  if (!ok) {
    return Response.json({ message: "Too many requests. Please slow down." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const offset = parseOffset(searchParams.get("offset"));

  const serverSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Ask for one extra row so we know whether another page exists.
  const { data, error } = await serverSupabase.rpc("explore_public_profiles", {
    result_limit: PAGE_SIZE + 1,
    result_offset: offset,
  });

  if (error) {
    return Response.json({ message: "Could not load explore feed" }, { status: 500 });
  }

  const rows = (data ?? []) as ExploreRow[];
  const hasMore = rows.length > PAGE_SIZE;

  return Response.json({
    profiles: rows.slice(0, PAGE_SIZE).map((row) => ({
      username: row.username,
      entriesLast7: row.entries_last_7,
      totalEntries: row.total_entries,
      lastEntryDate: row.last_entry_date,
      avgScoreLast7: row.avg_score_last_7 === null ? null : Number(row.avg_score_last_7),
      recentDays: row.recent_days ?? [],
    })),
    offset,
    hasMore,
  });
}
