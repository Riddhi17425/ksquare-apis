import { pool } from "../config/db.js";

export const pressReleaseModel = {
  /** Public website: active, non-deleted press releases, newest first. */
  async listPublished() {
    const [rows] = await pool.execute(
      `SELECT id, title, url, description, img
         FROM press_releases
        WHERE status = 'active' AND deleted_at IS NULL
        ORDER BY id DESC`,
    );
    return rows;
  },
};
