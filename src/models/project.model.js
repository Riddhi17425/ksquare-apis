import { pool } from "../config/db.js";

// Only active projects of active categories are public (soft-deleted ones are never returned).
const PUBLIC_PROJECT = `JOIN projects p ON p.id = x.project_id AND p.status = 'active' AND p.deleted_at IS NULL
  JOIN project_categories pc ON pc.id = p.project_categories_id AND pc.status = 'active' AND pc.deleted_at IS NULL`;

export const projectModel = {
  /** Public website: the project entries, by category order then the order they were entered. */
  async listItems() {
    const [rows] = await pool.execute(
      `SELECT pc.id AS category_id, pc.category, x.title, x.tag, x.location, x.short_note, x.power_capacity, x.project_img
         FROM project_items x ${PUBLIC_PROJECT} ORDER BY pc.id, p.id, x.sort_order, x.id`,
    );
    return rows;
  },

  /** Public website: the named pictures of the projects. */
  async listPictures() {
    const [rows] = await pool.execute(`SELECT x.name, x.img FROM project_images x ${PUBLIC_PROJECT} ORDER BY p.id, x.sort_order, x.id`);
    return rows;
  },
};
