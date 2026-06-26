const DEFAULT_BLACKLIST = [
  "12345678"
];

const DEFAULT_BLACKLISTED_MESSAGE = "YOU'RE BLACKLISTED, IDK WHY YOU THOUGHT YOU COULD COME IN HERE";
const DEFAULT_ACCESS_GRANTED_MESSAGE = "Access granted";

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      styledMessage: "<span style='color: white; background-color: red; padding: 2px 6px; border-radius: 3px;'>ERROR: Method not allowed</span>"
    });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({
      error: "Missing UserId parameter",
      styledMessage: "<span style='color: white; background-color: red; padding: 2px 6px; border-radius: 3px;'>ERROR: Missing UserID</span>"
    });
  }

  const userIdStr = String(userId).trim();

  if (!/^\d+$/.test(userIdStr)) {
    return res.status(400).json({
      error: "Invalid UserId format",
      styledMessage: "<span style='color: white; background-color: red; padding: 2px 6px; border-radius: 3px;'>ERROR: Invalid UserID</span>"
    });
  }

  const BLACKLIST_ENV = process.env.BLACKLIST_IDS || "";
  const BLACKLIST = BLACKLIST_ENV
    ? BLACKLIST_ENV.split(',').map(id => id.trim()).filter(id => id.length > 0)
    : DEFAULT_BLACKLIST;

  const BLACKLISTED_MESSAGE = process.env.BLACKLISTED_MESSAGE || DEFAULT_BLACKLISTED_MESSAGE;

  const isBlacklisted = BLACKLIST.includes(userIdStr);

  if (isBlacklisted) {
    return res.status(200).json({
      blacklisted: true,
      message: BLACKLISTED_MESSAGE,
      styledMessage: `<span style='color: white; background-color: red; padding: 4px 8px; border-radius: 4px; font-weight: bold;'>${BLACKLISTED_MESSAGE}</span>`,
      action: "KICK_USER",
      kickReason: "User ID is blacklisted"
    });
  } else {
    return res.status(200).json({
      blacklisted: false,
      silent: true
    });
  }
};
