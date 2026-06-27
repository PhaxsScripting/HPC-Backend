const { kv } = require('@vercel/kv');

/**
 * Simple fixed-window rate limiter backed by Vercel KV.
 * Fails OPEN on KV errors — a Redis hiccup should never take down the
 * endpoint it's protecting.
 *
 * @param {string} identifier - unique key for whatever you're limiting (e.g. an IP)
 * @param {object} opts
 * @param {number} opts.limit - max requests allowed per window
 * @param {number} opts.windowSeconds - window length in seconds
 * @returns {Promise<{allowed: boolean, remaining: number, retryAfterSeconds: number}>}
 */
async function checkRateLimit(identifier, { limit = 30, windowSeconds = 10 } = {}) {
  const key = `ratelimit:${identifier}`;
  try {
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, windowSeconds);
    }
    if (count > limit) {
      const ttl = await kv.ttl(key);
      return { allowed: false, remaining: 0, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
    }
    return { allowed: true, remaining: Math.max(0, limit - count), retryAfterSeconds: 0 };
  } catch (err) {
    console.error('[ratelimit] check failed, failing open:', err.message);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Best-effort client IP extraction behind Vercel's proxy. */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

module.exports = { checkRateLimit, getClientIp };
