/**
 * In-memory rate limiter for API routes.
 * Protects against bot abuse without frustrating real users.
 *
 * Two layers of protection:
 * 1. Per-IP rate limits (requests per time window)
 * 2. Global concurrent limit for heavy operations (video/gif)
 */

type RateLimitBucket = 'video' | 'gif' | 'image' | 'proxy';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();

// Global concurrent heavy operations (video + gif encoding)
let activeConcurrent = 0;
const MAX_CONCURRENT_HEAVY = 4;

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

const LIMITS: Record<RateLimitBucket, { maxRequests: number; windowMs: number }> = {
  video: { maxRequests: 5, windowMs: 5 * 60 * 1000 },
  gif:   { maxRequests: 10, windowMs: 5 * 60 * 1000 },
  image: { maxRequests: 20, windowMs: 5 * 60 * 1000 },
  proxy: { maxRequests: 200, windowMs: 5 * 60 * 1000 },
};

function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Check per-IP rate limit for a given bucket.
 * Returns a 429 Response if limit exceeded, or null if allowed.
 */
export function checkRateLimit(request: Request, bucket: RateLimitBucket): Response | null {
  const ip = getClientIP(request);
  const config = LIMITS[bucket];
  const key = `${ip}:${bucket}`;
  const now = Date.now();

  const record = store.get(key);

  if (!record || now > record.resetTime) {
    store.set(key, { count: 1, resetTime: now + config.windowMs });
    return null;
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please wait a moment and try again.',
        retryAfterSeconds: retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  record.count++;
  return null;
}

/**
 * Try to acquire a slot for a heavy operation (video/gif).
 * Returns false if the server is already at max concurrent heavy ops.
 */
export function acquireConcurrentSlot(): boolean {
  if (activeConcurrent >= MAX_CONCURRENT_HEAVY) return false;
  activeConcurrent++;
  return true;
}

/**
 * Release a heavy operation slot. Always call in a finally block.
 */
export function releaseConcurrentSlot(): void {
  activeConcurrent = Math.max(0, activeConcurrent - 1);
}

/**
 * Returns a 503 response for when the server is at capacity.
 */
export function serverBusyResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Server is busy processing other requests. Please try again in a moment.',
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '10' },
    }
  );
}
