import { pool } from "../config/db.js";

export const awardModel = {
  /** Public website: active, non-deleted awards, oldest year first. */
  async listPublished() {
    const [rows] = await pool.execute(
      `SELECT id, year, title, description, img, is_feature
         FROM awards_timelines
        WHERE status = 'active' AND deleted_at IS NULL
        ORDER BY year ASC, id ASC`,
    );
    return rows;
  },
};
