// Simpele in-memory token-bucket per IP. Werkt prima op één Node-proces;
// op Vercel met meerdere regions is dit best-effort. Voor productie-gebruik
// later vervangen door Upstash of Supabase Edge KV.

type Bucket = { tokens: number; lastRefill: number }
const buckets = new Map<string, Bucket>()

const MAX_KEYS = 5000

function gc() {
  if (buckets.size <= MAX_KEYS) return
  const now = Date.now()
  for (const [k, v] of buckets) {
    if (now - v.lastRefill > 60_000) buckets.delete(k)
    if (buckets.size <= MAX_KEYS) break
  }
}

export function rateLimit(key: string, limit: number, windowMs = 60_000): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now()
  const bucket = buckets.get(key) ?? { tokens: limit, lastRefill: now }

  // Refill: lineair, full bucket per windowMs
  const elapsed = now - bucket.lastRefill
  const refill = (elapsed / windowMs) * limit
  bucket.tokens = Math.min(limit, bucket.tokens + refill)
  bucket.lastRefill = now

  if (bucket.tokens < 1) {
    buckets.set(key, bucket)
    const retryAfter = Math.ceil(((1 - bucket.tokens) / limit) * windowMs / 1000)
    return { ok: false, retryAfter: Math.max(1, retryAfter) }
  }

  bucket.tokens -= 1
  buckets.set(key, bucket)
  gc()
  return { ok: true }
}

export function ipFromRequest(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}
