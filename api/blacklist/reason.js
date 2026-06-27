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

  const { robloxId, reason, updatedByDiscordId, updatedByDiscordUsername } = req.body || {};

  if (!robloxId || !/^\d+$/.test(String(robloxId))) {
    return res.status(400).json({ error: "Invalid or missing robloxId" });
  }
  if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
    return res.status(400).json({ error: "Missing reason" });
  }

  const idStr = String(robloxId);

  // Make sure they're actually blacklisted first
  const isMember = await kv.sismember("blacklist", idStr);
  if (!isMember) {
    return res.status(404).json({ error: "Roblox ID not found in blacklist" });
  }

  await kv.hset(`blacklist:meta:${idStr}`, { reason: reason.trim() });

  await logAuditEvent({
    action: "reason_updated",
    robloxId: idStr,
    reason: reason.trim(),
    discordId: updatedByDiscordId || null,
    discordUsername: updatedByDiscordUsername || null
  });

  return res.status(200).json({ success: true, robloxId: idStr, reason: reason.trim() });
};
