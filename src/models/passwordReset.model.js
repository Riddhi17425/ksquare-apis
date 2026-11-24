import { pool } from "../config/db.js";

export const passwordResetModel = {
  /** Replaces any outstanding tokens for the admin with a fresh one. */
  async createFor(adminId, tokenHash, ttlMinutes) {
    await pool.execute("DELETE FROM password_resets WHERE admin_id = ?", [adminId]);
    await pool.execute(
      "INSERT INTO password_resets (admin_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))",
      [adminId, tokenHash, ttlMinutes],
    );
  },

  async isValid(tokenHash) {
    const [rows] = await pool.execute(
      "SELECT 1 FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1",
      [tokenHash],
    );
    return rows.length > 0;
  },

  /** Atomically spends the token (inside the caller's transaction). Returns the admin id, or null if unusable. */
  async consume(tokenHash, conn) {
    const [rows] = await conn.execute(
      "SELECT id, admin_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1 FOR UPDATE",
      [tokenHash],
    );
    if (!rows[0]) return null;
    await conn.execute("UPDATE password_resets SET used_at = NOW() WHERE id = ?", [rows[0].id]);
    return rows[0].admin_id;
  },

  async deleteExpired() {
    await pool.execute("DELETE FROM password_resets WHERE expires_at <= NOW() OR used_at IS NOT NULL");
  },
};
