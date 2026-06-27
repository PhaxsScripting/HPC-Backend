const { getAuditLog } = require('../../lib/audit');

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

  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

  try {
    const entries = await getAuditLog(limit);
    return res.status(200).json({ success: true, entries });
  } catch (err) {
    console.error("[history] Failed to fetch audit log:", err.message);
    return res.status(500).json({ error: "Failed to fetch audit log", details: err.message });
  }
};
