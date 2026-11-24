import { pool } from "../config/db.js";

const run = (conn) => conn ?? pool;

export const adminModel = {
  async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT id, name, email, password_hash, role, is_active, failed_login_attempts,
              (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked
         FROM admins WHERE email = ? LIMIT 1`,
      [email],
    );
    return rows[0] ?? null;
  },

  async findActiveById(id) {
    const [rows] = await pool.execute("SELECT id, name FROM admins WHERE id = ? AND is_active = 1 LIMIT 1", [id]);
    return rows[0] ?? null;
  },

  async findProfile(id) {
    const [rows] = await pool.execute("SELECT id, name, email, role, last_login_at, created_at FROM admins WHERE id = ? AND is_active = 1 LIMIT 1", [id]);
    return rows[0] ?? null;
  },

  async findPasswordHash(id) {
    const [rows] = await pool.execute("SELECT id, password_hash FROM admins WHERE id = ? AND is_active = 1 LIMIT 1", [id]);
    return rows[0] ?? null;
  },

  async emailTaken(email, excludeId) {
    const [rows] = await pool.execute("SELECT 1 FROM admins WHERE email = ? AND id <> ? LIMIT 1", [email, excludeId]);
    return rows.length > 0;
  },

  async updateProfile(id, { name, email }) {
    await pool.execute("UPDATE admins SET name = ?, email = ? WHERE id = ?", [name, email, id]);
  },

  /** Authors a blog can be assigned to. */
  async listActive() {
    const [rows] = await pool.execute("SELECT id, name FROM admins WHERE is_active = 1 ORDER BY name");
    return rows;
  },

  /**
   * Counts a failed login; locks the account once `max` failures are reached.
   * locked_until is assigned before the counter because SET assignments are evaluated left to right.
   */
  async recordFailedLogin(id, max, lockoutMinutes) {
    await pool.execute(
      `UPDATE admins
          SET locked_until = IF(failed_login_attempts + 1 >= ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), locked_until),
              failed_login_attempts = IF(failed_login_attempts + 1 >= ?, 0, failed_login_attempts + 1)
        WHERE id = ?`,
      [max, lockoutMinutes, max, id],
    );
  },

  async recordSuccessfulLogin(id) {
    await pool.execute(
      "UPDATE admins SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?",
      [id],
    );
  },

  async updatePassword(id, passwordHash, conn) {
    await run(conn).execute(
      "UPDATE admins SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL WHERE id = ?",
      [passwordHash, id],
    );
  },
};
