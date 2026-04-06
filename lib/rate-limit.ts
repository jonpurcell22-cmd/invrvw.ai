/**
 * Simple in-memory rate limiter.
 * Tracks requests per IP with a sliding window.
 * Resets automatically — no cleanup needed for low-traffic MVP.
 */

const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  ip: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

/** Clean old entries periodically (call from a route or ignore for MVP) */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.resetAt) store.delete(key);
  }
}
