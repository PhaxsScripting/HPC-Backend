const { kv } = require('@vercel/kv');

const AUDIT_KEY = 'blacklist:audit';
const MAX_AUDIT_ENTRIES = 500; // keep the log bounded so it doesn't grow forever

/**
 * Appends an entry to the blacklist audit log (newest first) and trims the
 * log to the most recent MAX_AUDIT_ENTRIES events.
 *
 * This is intentionally "fire and forget" from the caller's perspective —
 * a failure here is logged but never thrown, so a KV hiccup on the audit
 * log can't block an actual add/remove/reason operation.
 *
 * @param {object} entry
 * @param {"added"|"removed"|"reason_updated"} entry.action
 * @param {string} entry.robloxId
 */
async function logAuditEvent(entry) {
  const record = {
    ...entry,
    timestamp: new Date().toISOString()
  };
  try {
    await kv.lpush(AUDIT_KEY, JSON.stringify(record));
    await kv.ltrim(AUDIT_KEY, 0, MAX_AUDIT_ENTRIES - 1);
  } catch (err) {
    console.error('[audit] Failed to log event:', err.message);
  }
}

/**
 * Returns the most recent `limit` audit entries, newest first.
 * @param {number} limit
 */
async function getAuditLog(limit = 100) {
  const raw = await kv.lrange(AUDIT_KEY, 0, limit - 1);
  return (raw || [])
    .map((item) => {
      // @vercel/kv sometimes auto-deserializes JSON-looking strings, so
      // handle both "already an object" and "still a JSON string".
      if (typeof item === 'object' && item !== null) return item;
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

module.exports = { logAuditEvent, getAuditLog };
