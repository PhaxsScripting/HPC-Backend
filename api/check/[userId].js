// HPC Blacklist API - Checks if user ID is blacklisted
// Returns styled response for display in game/client
// For non-blacklisted users, returns a silent response (no message displayed)

// Default blacklist IDs (can be overridden by BLACKLIST_IDS env variable)
const DEFAULT_BLACKLIST = [
  "7282753926" 
];

// Default messages (can be overridden by env variables)
const DEFAULT_BLACKLISTED_MESSAGE = "YOU'RE BLACKLISTED, IDK WHY YOU THOUGHT YOU COULD COME IN HERE";
const DEFAULT_ACCESS_GRANTED_MESSAGE = "Access granted"; // Not used for silent response

module.exports = function handler(req, res) {
  // Set CORS headers for frontend/game access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
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

  // Validate userId
  if (!userId) {
    return res.status(400).json({
      error: "Missing UserId parameter",
      styledMessage: "<span style='color: white; background-color: red; padding: 2px 6px; border-radius: 3px;'>ERROR: Missing UserID</span>"
    });
  }

  // Ensure userId is a string for comparison
  const userIdStr = String(userId).trim();

  // Validate userId format (optional - only allow numeric IDs)
  if (!/^\d+$/.test(userIdStr)) {
    return res.status(400).json({
      error: "Invalid UserId format",
      styledMessage: "<span style='color: white; background-color: red; padding: 2px 6px; border-radius: 3px;'>ERROR: Invalid UserID</span>"
    });
  }

  // Get blacklist from env var or use default
  const BLACKLIST_ENV = process.env.BLACKLIST_IDS || "";
  const BLACKLIST = BLACKLIST_ENV
    ? BLACKLIST_ENV.split(',').map(id => id.trim()).filter(id => id.length > 0)
    : DEFAULT_BLACKLIST;

  // Get custom messages from env vars or use defaults
  const BLACKLISTED_MESSAGE = process.env.BLACKLISTED_MESSAGE || DEFAULT_BLACKLISTED_MESSAGE;
  // const ACCESS_GRANTED_MESSAGE = process.env.ACCESS_GRANTED_MESSAGE || DEFAULT_ACCESS_GRANTED_MESSAGE; // Not used for silent response

  // Check if user is blacklisted
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
    // For non-blacklisted users, return a silent response (no message to display)
    return res.status(200).json({
      blacklisted: false,
      silent: true   // Indicates that no message should be displayed to the user
      // No styledMessage or action needed
    });
  }
};
