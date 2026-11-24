import { pool } from "../config/db.js";

const run = (conn) => conn ?? pool;

export const sessionModel = {
  async create({ adminId, tokenHash, ip, userAgent, ttlMinutes }) {
    await pool.execute(
      `INSERT INTO admin_sessions (admin_id, token_hash, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [adminId, tokenHash, ip?.slice(0, 45) ?? null, userAgent?.slice(0, 255) ?? null, ttlMinutes],
    );
  },

  /** Session that is within both its absolute and idle lifetime, for an active admin. */
  async findActive(tokenHash, idleMinutes) {
    const [rows] = await pool.execute(
      `SELECT s.id, a.id AS admin_id, a.name, a.email, a.role
         FROM admin_sessions s
         JOIN admins a ON a.id = s.admin_id
        WHERE s.token_hash = ?
          AND s.expires_at > NOW()
          AND s.last_used_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
          AND a.is_active = 1
        LIMIT 1`,
      [tokenHash, idleMinutes],
    );
    return rows[0] ?? null;
  },

  async touch(id) {
    await pool.execute("UPDATE admin_sessions SET last_used_at = NOW() WHERE id = ?", [id]);
  },

  async deleteById(id) {
    await pool.execute("DELETE FROM admin_sessions WHERE id = ?", [id]);
  },

  async deleteAllForAdmin(adminId, conn) {
    await run(conn).execute("DELETE FROM admin_sessions WHERE admin_id = ?", [adminId]);
  },

  /** Signs the admin out everywhere except the session in use. */
  async deleteOthers(adminId, keepSessionId, conn) {
    await run(conn).execute("DELETE FROM admin_sessions WHERE admin_id = ? AND id <> ?", [adminId, keepSessionId]);
  },

  async deleteExpired(idleMinutes) {
    await pool.execute(
      "DELETE FROM admin_sessions WHERE expires_at <= NOW() OR last_used_at <= DATE_SUB(NOW(), INTERVAL ? MINUTE)",
      [idleMinutes],
    );
  },
};
