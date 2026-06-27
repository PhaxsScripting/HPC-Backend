const { kv } = require('@vercel/kv');
const { checkRateLimit, getClientIp } = require('../../lib/ratelimit');

const HARDCODED_BLACKLIST = [
];

const BLACKLISTED_MESSAGE = "YOU'RE BLACKLISTED, IDK WHY YOU THOUGHT YOU COULD COME IN HERE";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // Lightweight per-IP rate limit — this endpoint is public/unauthenticated
  // by design (Roblox calls it directly), so it needs its own protection
  // against being hammered.
  const clientIp = getClientIp(req);
  const { allowed, retryAfterSeconds } = await checkRateLimit(`check:${clientIp}`, {
    limit: 30,
    windowSeconds: 10
  });
  if (!allowed) {
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({ error: "Too many requests — slow down." });
  }

  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: "Missing userId parameter" });

  const userIdStr = String(userId).trim();
  if (!/^\d+$/.test(userIdStr)) return res.status(400).json({ error: "Invalid userId: digits only" });

  let dynamicList = [];
  try {
    dynamicList = (await kv.smembers("blacklist")) || [];
  } catch (e) {
    console.error("[check] smembers failed:", e.message);
  }

  // Force everything to strings — @vercel/kv auto-deserializes
  // numeric-looking values back into JS numbers, which silently
  // breaks Set.has() against a string userId.
  const allBlacklisted = new Set([
    ...HARDCODED_BLACKLIST.map(String),
    ...dynamicList.map(String)
  ]);

  const isBlacklisted = allBlacklisted.has(userIdStr);

  if (isBlacklisted) {
    return res.status(200).json({
      blacklisted: true,
      message: BLACKLISTED_MESSAGE,
      styledMessage: "<font color='rgb(255,255,255)'>" + BLACKLISTED_MESSAGE + "</font>",
      action: "KICK_USER",
      kickReason: BLACKLISTED_MESSAGE
    });
  }

  return res.status(200).json({ blacklisted: false, silent: true });
};
