import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/ratelimit";
import { computeStats, getRecentEntries } from "@/components/dashboard/dashboard-helpers";
import type {
  DailyEntry,
  MetricDefinition,
  MetricValue,
} from "@/components/dashboard/dashboard-types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type ProfileRow = {
  user_id: string;
  username: string;
  is_public: boolean;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ message: "Server profile API is not configured" }, { status: 500 });
  }

  const { ok } = await checkRateLimit(request, "profile");
  if (!ok) {
    return Response.json({ message: "Too many requests. Please slow down." }, { status: 429 });
  }

  const serverSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { username } = await params;
  const normalized = username.trim().toLowerCase();

  if (!normalized) {
    return Response.json({ message: "No Daymap found for this username" }, { status: 404 });
  }

  const { data: profile, error: profileError } = await serverSupabase
    .from("profiles")
    .select("user_id, username, is_public")
    .eq("username", normalized)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    return Response.json({ message: "Could not load profile" }, { status: 500 });
  }

  if (!profile) {
    return Response.json({ message: "No Daymap found for this username" }, { status: 404 });
  }

  if (!profile.is_public) {
    return Response.json({
      exists: true,
      username: profile.username,
      is_public: false,
    });
  }

  const { data: entriesData, error: entriesError } = await serverSupabase
    .from("daily_entries")
    .select("id, user_id, entry_date, score, note, priority_update, bedtime, instagram_minutes, created_at, updated_at")
    .eq("user_id", profile.user_id)
    .order("entry_date", { ascending: false })
    .limit(500);

  if (entriesError) {
    return Response.json({ message: "Could not load entries" }, { status: 500 });
  }

  const entries = (entriesData ?? []) as DailyEntry[];
  const currentYear = new Date().getFullYear();

  // Custom metrics are public along with the rest of a public Daymap. Fetch the
  // owner's active metrics and their values so the profile can trend them.
  const { data: metricDefsData } = await serverSupabase
    .from("metric_definitions")
    .select("id, user_id, name, unit, kind, is_public, sort_order, archived, created_at, updated_at")
    .eq("user_id", profile.user_id)
    .eq("archived", false)
    .order("sort_order", { ascending: true });

  const metricDefs = (metricDefsData ?? []) as MetricDefinition[];

  let metricValues: MetricValue[] = [];
  if (metricDefs.length) {
    const { data: metricValuesData } = await serverSupabase
      .from("metric_values")
      .select("id, user_id, metric_id, entry_date, value, created_at, updated_at")
      .eq("user_id", profile.user_id)
      .order("entry_date", { ascending: false })
      .limit(1000);
    metricValues = (metricValuesData ?? []) as MetricValue[];
  }

  return Response.json({
    exists: true,
    username: profile.username,
    is_public: true,
    stats: computeStats(entries, currentYear),
    recent: getRecentEntries(entries),
    entries,
    metricDefs,
    metricValues,
  });
}
