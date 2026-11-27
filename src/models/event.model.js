import { pool } from "../config/db.js";

export const eventModel = {
  /** Public website: active, non-deleted events, latest first. */
  async listPublished() {
    const [rows] = await pool.execute(
      `SELECT id, name, location, img, from_date, to_date
         FROM events
        WHERE status = 'active' AND deleted_at IS NULL
        ORDER BY from_date DESC, id DESC`,
    );
    return rows;
  },
};
