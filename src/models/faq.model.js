import { pool } from "../config/db.js";
import { likeTerm } from "../utils/pagination.js";

// FAQs of a soft-deleted category are hidden too, hence the join condition on c.deleted_at.
const FROM = "FROM faqs f JOIN faq_categories c ON c.id = f.category_id AND c.deleted_at IS NULL";
const COLUMNS = "f.id, f.category_id, f.question, f.answer, f.sort_order, f.created_at, f.updated_at, c.name AS category_name, c.status AS category_status";

export const faqModel = {
  async list({ page, limit, q, category_id }) {
    const where = [];
    const params = [];
    if (category_id) {
      where.push("f.category_id = ?");
      params.push(category_id);
    }
    if (q) {
      where.push("(f.question LIKE ? OR f.answer LIKE ?)");
      params.push(likeTerm(q), likeTerm(q));
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total ${FROM} ${clause}`, params);
    const [rows] = await pool.execute(
      `SELECT ${COLUMNS} ${FROM} ${clause} ORDER BY c.name, f.sort_order, f.id LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params,
    );
    return { rows, total };
  },

  /** Public website: FAQs of active, non-deleted categories, in category order then their own order. */
  async listPublished() {
    const [rows] = await pool.execute(
      `SELECT c.id AS category_id, c.name AS category, f.question, f.answer
         FROM faqs f JOIN faq_categories c ON c.id = f.category_id AND c.deleted_at IS NULL AND c.status = 'active'
        ORDER BY c.id, f.sort_order, f.id`,
    );
    return rows;
  },

  async listByCategory(categoryId) {
    const [rows] = await pool.execute("SELECT id, question, answer, sort_order FROM faqs WHERE category_id = ? ORDER BY sort_order, id", [categoryId]);
    return rows;
  },

  /** Case-insensitive: the same question cannot appear twice in one category. */
  async questionExists(categoryId, question, excludeId = 0) {
    const [rows] = await pool.execute("SELECT 1 FROM faqs WHERE category_id = ? AND question = ? AND id <> ? LIMIT 1", [categoryId, question, excludeId]);
    return rows.length > 0;
  },

  async findById(id) {
    const [rows] = await pool.execute(`SELECT ${COLUMNS} ${FROM} WHERE f.id = ? LIMIT 1`, [id]);
    return rows[0] ?? null;
  },

  /** Appends the items after the category's existing FAQs, keeping their submitted order. */
  async createMany(conn, categoryId, items) {
    const [[{ max }]] = await conn.execute("SELECT COALESCE(MAX(sort_order), 0) AS max FROM faqs WHERE category_id = ?", [categoryId]);
    for (let i = 0; i < items.length; i++)
      await conn.execute("INSERT INTO faqs (category_id, question, answer, sort_order) VALUES (?, ?, ?, ?)", [
        categoryId,
        items[i].question,
        items[i].answer,
        Number(max) + i + 1,
      ]);
  },

  async update(id, { category_id, question, answer }) {
    await pool.execute("UPDATE faqs SET category_id = ?, question = ?, answer = ? WHERE id = ?", [category_id, question, answer, id]);
  },

  async remove(id) {
    const [r] = await pool.execute("DELETE FROM faqs WHERE id = ?", [id]);
    return r.affectedRows > 0;
  },
};
