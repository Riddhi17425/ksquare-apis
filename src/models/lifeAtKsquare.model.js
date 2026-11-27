import { pool } from "../config/db.js";

export const lifeAtKsquareModel = {
  /** Public website: active, non-deleted photos, oldest first (the order they were added). */
  async listPublished() {
    const [rows] = await pool.execute(
      `SELECT id, img FROM life_at_ksquare WHERE status = 'active' AND deleted_at IS NULL ORDER BY id ASC`,
    );
    return rows;
  },
};
