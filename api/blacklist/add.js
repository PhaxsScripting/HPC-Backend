const { kv } = require('@vercel/kv');
const { logAuditEvent } = require('../../lib/audit');

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

  const { robloxId, robloxUsername, discordId, discordUsername, reason, expiresAt } = req.body || {};

  if (!robloxId || !/^\d+$/.test(String(robloxId))) {
    return res.status(400).json({ error: "Invalid or missing robloxId" });
  }
  if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
    return res.status(400).json({ error: "Invalid expiresAt — must be an ISO date string" });
  }

  const idStr = String(robloxId);

  try {
    const alreadyBlacklisted = await kv.sismember("blacklist", idStr);
    if (alreadyBlacklisted) {
      // Not an error — bot.js already checks this, but stay idempotent if called directly.
      return res.status(200).json({ success: true, alreadyBlacklisted: true, robloxId: idStr });
    }

    const addedAt = new Date().toISOString();

    await kv.sadd("blacklist", idStr);
    await kv.hset(`blacklist:meta:${idStr}`, {
      robloxUsername: robloxUsername || "Unknown",
      discordUsername: discordUsername || "Unknown",
      discordId: discordId || "Unknown",
      addedAt,
      reason: reason || "",
      expiresAt: expiresAt || ""
    });

    await logAuditEvent({
      action: "added",
      robloxId: idStr,
      robloxUsername: robloxUsername || "Unknown",
      discordId: discordId || "Unknown",
      discordUsername: discordUsername || "Unknown",
      reason: reason || null,
      expiresAt: expiresAt || null
    });

    return res.status(200).json({ success: true, robloxId: idStr, addedAt });
  } catch (err) {
    console.error("[add] Failed to add to blacklist:", err.message);
    return res.status(500).json({ error: "Failed to add to blacklist", details: err.message });
  }
};
