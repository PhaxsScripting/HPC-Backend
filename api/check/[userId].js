const { kv } = require('@vercel/kv');

const HARDCODED_BLACKLIST = [
  "7282753926",
  "12345678",
  "87654321",
  "11111111",
  "22222222"
];

const BLACKLISTED_MESSAGE = "YOU'RE BLACKLISTED, IDK WHY YOU THOUGHT YOU COULD COME IN HERE";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: "Missing userId parameter" });

  const userIdStr = String(userId).trim();
  if (!/^\d+$/.test(userIdStr)) return res.status(400).json({ error: "Invalid userId: digits only" });

  let dynamicList = [];
  try {
    dynamicList = (await kv.smembers("blacklist")) || [];
  } catch (e) {}

  const allBlacklisted = new Set([...HARDCODED_BLACKLIST, ...dynamicList]);
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
