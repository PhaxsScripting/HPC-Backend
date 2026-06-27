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
    const ids = (await kv.smembers("blacklist")) || [];
    return res.status(200).json({ success: true, ids: ids.map(String) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch blacklist", details: err.message });
  }
};
