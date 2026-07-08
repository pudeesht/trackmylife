import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type ProfileRow = {
  username: string;
};

function normalizeUsernameQuery(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
}

export async function GET(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ message: "Server search API is not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("query") ?? searchParams.get("q") ?? "";
  const query = normalizeUsernameQuery(raw);

  if (!query) {
    return Response.json({ query: "", results: [] as Array<{ username: string }> });
  }

  const serverSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await serverSupabase
    .from("profiles")
    .select("username")
    .like("username", `${query}%`)
    .order("username", { ascending: true })
    .limit(12)
    .returns<ProfileRow[]>();

  if (error) {
    return Response.json({ message: "Could not search users" }, { status: 500 });
  }

  return Response.json({
    query,
    results: (data ?? []).map((row) => ({ username: row.username })),
  });
}
