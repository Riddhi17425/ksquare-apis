import { pool } from "../config/db.js";
import { likeTerm } from "../utils/pagination.js";

const COLUMNS = [
  "list_image",
  "name",
  "slug",
  "meta_title",
  "meta_description",
  "short_description",
  "title",
  "detail_image_d",
  "detail_image_m",
  "product_summary",
  "why_choose_summary",
  "why_choose_title",
  "why_choose_desc",
  "product_short_line",
  "configuration_short_line",
  "why_choose_img",
  "menu_img",
  "type",
  "status",
];

export const categoryModel = {
  async list({ page, limit, q }) {
    // Soft-deleted categories (deleted_at set) are excluded everywhere.
    const where = q ? "WHERE c.deleted_at IS NULL AND (c.name LIKE ? OR c.slug LIKE ? OR c.title LIKE ? OR c.short_description LIKE ?)" : "WHERE c.deleted_at IS NULL";
    const params = q ? [likeTerm(q), likeTerm(q), likeTerm(q), likeTerm(q)] : [];
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM categories c ${where}`, params);
    const [rows] = await pool.execute(
      `SELECT c.id, c.list_image, c.name, c.slug, c.short_description, c.title, c.type, c.status, c.created_at,
              (SELECT COUNT(*) FROM category_configurations cc WHERE cc.category_id = c.id) AS configuration_count
         FROM categories c ${where} ORDER BY c.created_at DESC, c.id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params,
    );
    return { rows, total };
  },

  async findById(id, conn = pool) {
    const [rows] = await conn.execute("SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL LIMIT 1", [id]);
    return rows[0] ?? null;
  },

  async configurations(categoryId, conn = pool) {
    const [rows] = await conn.execute(
      "SELECT id, title, description, icon, sort_order FROM category_configurations WHERE category_id = ? ORDER BY sort_order, id",
      [categoryId],
    );
    return rows;
  },

  async nameExists(name, excludeId = 0) {
    const [rows] = await pool.execute("SELECT 1 FROM categories WHERE name = ? AND deleted_at IS NULL AND id <> ? LIMIT 1", [name, excludeId]);
    return rows.length > 0;
  },

  async slugExists(slug, excludeId = 0) {
    const [rows] = await pool.execute("SELECT 1 FROM categories WHERE slug = ? AND deleted_at IS NULL AND id <> ? LIMIT 1", [slug, excludeId]);
    return rows.length > 0;
  },

  async insert(conn, data) {
    const [r] = await conn.execute(
      `INSERT INTO categories (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`,
      COLUMNS.map((c) => data[c]),
    );
    return r.insertId;
  },

  async update(conn, id, data) {
    await conn.execute(`UPDATE categories SET ${COLUMNS.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`, [
      ...COLUMNS.map((c) => data[c]),
      id,
    ]);
  },

  async insertConfiguration(conn, categoryId, { title, description, icon, sort_order }) {
    await conn.execute(
      "INSERT INTO category_configurations (category_id, title, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)",
      [categoryId, title, description, icon, sort_order],
    );
  },

  async updateConfiguration(conn, id, { title, description, icon, sort_order }) {
    await conn.execute("UPDATE category_configurations SET title = ?, description = ?, icon = ?, sort_order = ? WHERE id = ?", [
      title,
      description,
      icon,
      sort_order,
      id,
    ]);
  },

  async deleteConfigurations(conn, ids) {
    if (!ids.length) return;
    await conn.execute(`DELETE FROM category_configurations WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
  },

  async remove(id) {
    // Soft delete: the row, its images and its configuration entries are kept.
    const [r] = await pool.execute("UPDATE categories SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", [id]);
    return r.affectedRows > 0;
  },
};
