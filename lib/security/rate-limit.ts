import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory sliding-window rate limiter keyed by `ip|route|subject`.
 * Each deployment instance keeps its own counter; on Vercel this is a
 * per-serverless-instance throttle. Pair it with Supabase's built-in auth
 * rate limiting and (for production hardening) a shared store such as
 * Upstash Redis / Vercel KV.
 */
const store = new Map<string, Bucket>();

function prune(now: number) {
  if (store.size > 10_000) {
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
  }
}

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
  req: Request;
}): { ok: boolean; retryAfterSec: number; remaining: number } {
  const now = Date.now();
  prune(now);

  const ip = (req: Request) => {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "unknown";
  };

  const bucketKey = `${opts.key}|${ip(opts.req)}`;
  const bucket = store.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    store.set(bucketKey, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterSec: 0, remaining: opts.limit - 1 };
  }

  if (bucket.count >= opts.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    retryAfterSec: 0,
    remaining: opts.limit - bucket.count,
  };
}

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}