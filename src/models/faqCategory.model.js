import { pool } from "../config/db.js";
import { likeTerm } from "../utils/pagination.js";

export const faqCategoryModel = {
  /** Soft-deleted categories (deleted_at set) are excluded everywhere. */
  async list({ page, limit, q, status }) {
    const where = ["c.deleted_at IS NULL"];
    const params = [];
    if (status) {
      where.push("c.status = ?");
      params.push(status);
    }
    if (q) {
      where.push("c.name LIKE ?");
      params.push(likeTerm(q));
    }
    const clause = `WHERE ${where.join(" AND ")}`;
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM faq_categories c ${clause}`, params);
    const [rows] = await pool.execute(
      `SELECT c.id, c.name, c.status, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM faqs f WHERE f.category_id = c.id) AS faq_count
         FROM faq_categories c ${clause} ORDER BY c.name, c.id LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params,
    );
    return { rows, total };
  },

  /** Active, non-deleted categories: what the FAQ dropdown offers. */
  async options() {
    const [rows] = await pool.execute("SELECT id, name FROM faq_categories WHERE status = 'active' AND deleted_at IS NULL ORDER BY name");
    return rows;
  },

  async findById(id, conn = pool) {
    const [rows] = await conn.execute(
      `SELECT c.id, c.name, c.status, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM faqs f WHERE f.category_id = c.id) AS faq_count
         FROM faq_categories c WHERE c.id = ? AND c.deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  },

  async nameExists(name, excludeId = 0) {
    const [rows] = await pool.execute("SELECT 1 FROM faq_categories WHERE name = ? AND deleted_at IS NULL AND id <> ? LIMIT 1", [name, excludeId]);
    return rows.length > 0;
  },

  async create({ name, status }) {
    const [r] = await pool.execute("INSERT INTO faq_categories (name, status) VALUES (?, ?)", [name, status]);
    return r.insertId;
  },

  async update(id, { name, status }) {
    await pool.execute("UPDATE faq_categories SET name = ?, status = ? WHERE id = ? AND deleted_at IS NULL", [name, status, id]);
  },

  async updateStatus(id, status) {
    const [r] = await pool.execute("UPDATE faq_categories SET status = ? WHERE id = ? AND deleted_at IS NULL", [status, id]);
    return r.affectedRows > 0;
  },

  async softDelete(id) {
    const [r] = await pool.execute("UPDATE faq_categories SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", [id]);
    return r.affectedRows > 0;
  },
};
