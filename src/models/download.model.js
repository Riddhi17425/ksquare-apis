import { pool } from "../config/db.js";

export const downloadModel = {
  /** Public website: downloadable certificates of active, non-deleted categories, in category order then creation order. */
  async listPublished() {
    const [rows] = await pool.execute(
      `SELECT cc.id AS category_id, cc.name AS category, c.name AS title, c.pdf_file AS url
         FROM certificates c
         JOIN certificate_category cc ON cc.id = c.certificate_category_id AND cc.deleted_at IS NULL AND cc.status = 'active'
        WHERE c.status = 'active' AND c.deleted_at IS NULL AND c.pdf_file IS NOT NULL
        ORDER BY cc.id, c.id`,
    );
    return rows;
  },
};
