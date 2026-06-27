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

  const { robloxId, removedByDiscordId, removedByDiscordUsername, removalReason } = req.body || {};
  if (!robloxId || !/^\d+$/.test(String(robloxId))) {
    return res.status(400).json({ error: "Invalid or missing robloxId" });
  }
  const idStr = String(robloxId);

  // Snapshot the metadata BEFORE deleting it — this is the only chance to
  // capture who originally added them, why, and when for the audit log.
  let meta = null;
  try {
    meta = await kv.hgetall(`blacklist:meta:${idStr}`);
  } catch (e) {
    console.error(`[remove] hgetall failed for ${idStr}:`, e.message);
  }

  await kv.srem("blacklist", idStr);
  await kv.del(`blacklist:meta:${idStr}`);

  await logAuditEvent({
    action: "removed",
    robloxId: idStr,
    robloxUsername: meta?.robloxUsername || null,
    discordId: meta?.discordId || null,
    discordUsername: meta?.discordUsername || null,
    originalReason: meta?.reason || null,
    expiresAt: meta?.expiresAt || null,
    removedBy: removedByDiscordUsername || "Unknown",
    removedByDiscordId: removedByDiscordId || null,
    removalReason: removalReason || null
  });

  return res.status(200).json({ success: true, removed: idStr });
};
