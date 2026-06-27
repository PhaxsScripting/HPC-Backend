const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${process.env.BOT_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const raw = await kv.smembers("blacklist");
    const ids = (raw || []).map(String);

    console.log("[list] IDs from KV:", ids);

    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const meta = await kv.hgetall(`blacklist:meta:${id}`);
          console.log(`[list] meta for ${id}:`, meta);
          if (meta) {
            return {
              robloxId: String(id),
              robloxUsername: meta.robloxUsername || "Unknown",
              discordUsername: meta.discordUsername || "Unknown",
              discordId: meta.discordId || "Unknown",
              addedAt: meta.addedAt || null
            };
          } else {
            return {
              robloxId: String(id),
              robloxUsername: "Unknown",
              discordUsername: "Unknown",
              discordId: "Unknown",
              addedAt: null
            };
          }
        } catch (e) {
          console.error(`[list] hgetall failed for ${id}:`, e.message);
          return { robloxId: String(id), robloxUsername: "Unknown", discordUsername: "Unknown" };
        }
      })
    );

    return res.status(200).json({ success: true, entries });
  } catch (err) {
    console.error("[list] smembers failed:", err.message);
    return res.status(500).json({ error: "Failed to fetch blacklist", details: err.message });
  }
};
