import { pool } from "../config/db.js";

export const pageContentModel = {
  /** The saved JSON document of a page, or null when nothing was saved yet. */
  async get(page) {
    const [rows] = await pool.execute("SELECT content FROM page_content WHERE page = ? LIMIT 1", [page]);
    return rows[0] ? JSON.parse(rows[0].content) : null;
  },

  async save(page, content) {
    await pool.execute("INSERT INTO page_content (page, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)", [page, JSON.stringify(content)]);
  },
};
