const { kv } = require('@vercel/kv');
const axios = require('axios');

const WEBHOOK_KICKLOG = "https://discord.com/api/webhooks/1520308732398141521/odUanSBZcwX5TZmSSGx_11jS_V0o6AfxJJdn59I40fKL6SpVzvrQQX0mcpWfWeDY3iBq";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Same BOT_SECRET used as a shared key with your Roblox game HttpService calls
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${process.env.BOT_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { robloxId, robloxUsername, placeId, jobId } = req.body;

  if (!robloxId) {
    return res.status(400).json({ error: "Missing robloxId" });
  }

  const idStr      = String(robloxId);
  const kickedName = robloxUsername || idStr;
  const place      = placeId        || "Unknown Place";
  const job        = jobId          || "Unknown Server";
  const ts         = `<t:${Math.floor(Date.now() / 1000)}:F>`;

  // Pull their blacklist metadata for context
  let reason      = "No reason on file";
  let addedBy     = "Unknown";
  try {
    const meta = await kv.hgetall(`blacklist:meta:${idStr}`);
    if (meta?.reason)      reason  = meta.reason;
    if (meta?.discordUsername) addedBy = meta.discordUsername;
  } catch (_) {}

  // Log the kick to the webhook
  try {
    await axios.post(WEBHOOK_KICKLOG, {
      embeds: [{
        title: "🥾 Blacklisted Player Kicked",
        color: 0xff4400,
        fields: [
          { name: "Roblox Username", value: kickedName,         inline: true },
          { name: "Roblox ID",       value: `\`${idStr}\``,     inline: true },
          { name: "Kicked At",       value: ts,                 inline: true },
          { name: "Place ID",        value: String(place),      inline: true },
          { name: "Server Job ID",   value: `\`${job}\``,       inline: true },
          { name: "Blacklisted By",  value: addedBy,            inline: true },
          { name: "Reason",          value: reason,             inline: false }
        ],
        timestamp: new Date().toISOString()
      }]
    }, { headers: { "Content-Type": "application/json" } });
  } catch (webhookErr) {
    console.error("[kick] Webhook failed:", webhookErr.message);
  }

  return res.status(200).json({ success: true, logged: idStr });
};
