const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${process.env.BOT_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { robloxId, robloxUsername, discordId, discordUsername, reason, expiresAt } = req.body;

  if (!robloxId || !/^\d+$/.test(String(robloxId))) {
    return res.status(400).json({ error: "Invalid or missing robloxId" });
  }

  const idStr = String(robloxId);

  const metaData = {
    robloxId: idStr,
    robloxUsername: robloxUsername || "unknown",
    discordId: discordId || "unknown",
    discordUsername: discordUsername || "unknown",
    addedAt: new Date().toISOString()
  };
  if (reason) metaData.reason = reason;
  if (expiresAt) metaData.expiresAt = expiresAt;

  await kv.sadd("blacklist", idStr);
  await kv.hset(`blacklist:meta:${idStr}`, metaData);

  return res.status(200).json({ success: true, blacklisted: idStr });
};
