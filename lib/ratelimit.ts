import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting for the public, unauthenticated API routes.
//
// Backed by Upstash Redis so the limit holds across serverless instances on
// Vercel. When the Upstash env vars are absent (e.g. local dev), this no-ops
// and allows every request, so the app still runs without the external store.

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;

if (url && token) {
  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    // 20 requests per 10 seconds per IP. Generous for debounced search typing,
    // tight enough to stop enumeration/scraping loops.
    limiter: Ratelimit.slidingWindow(20, "10 s"),
    prefix: "trackmylife/ratelimit",
    analytics: false,
  });
} else if (process.env.NODE_ENV === "production") {
  // Fail open, but make the misconfiguration loud in production logs.
  console.warn(
    "[ratelimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — rate limiting is DISABLED."
  );
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // First entry is the original client; the rest are proxies.
    return forwardedFor.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Returns { ok: false } when the caller has exceeded the limit for `bucket`.
 * No-ops (returns ok) when Upstash is not configured.
 */
export async function checkRateLimit(
  request: Request,
  bucket: string
): Promise<{ ok: boolean }> {
  if (!ratelimit) {
    return { ok: true };
  }

  const ip = getClientIp(request);
  const { success } = await ratelimit.limit(`${bucket}:${ip}`);
  return { ok: success };
}
