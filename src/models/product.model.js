import { pool } from "../config/db.js";
import { likeTerm } from "../utils/pagination.js";

const COLUMNS = [
  "category_id", "name", "slug", "meta_title", "meta_description", "short_description", "list_img", "title", "product_info",
  "highlights", "benefits", "features", "technical_specification", "installation_process", "status",
];

export const productModel = {
  /** Soft-deleted products (deleted_at set) are excluded everywhere. */
  async list({ page, limit, q, status }) {
    const where = ["p.deleted_at IS NULL"];
    const params = [];
    if (status) {
      where.push("p.status = ?");
      params.push(status);
    }
    if (q) {
      where.push("(p.name LIKE ? OR p.title LIKE ? OR p.short_description LIKE ?)");
      params.push(likeTerm(q), likeTerm(q), likeTerm(q));
    }
    const clause = `WHERE ${where.join(" AND ")}`;
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM products p ${clause}`, params);
    const [rows] = await pool.execute(
      `SELECT p.id, p.name, p.slug, p.title, p.list_img, p.status, p.created_at, c.name AS category_name,
              (SELECT COUNT(*) FROM product_images i WHERE i.product_id = p.id) AS image_count,
              (SELECT COUNT(*) FROM product_faqs f WHERE f.product_id = p.id) AS faq_count
         FROM products p LEFT JOIN categories c ON c.id = p.category_id ${clause} ORDER BY p.id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params,
    );
    return { rows, total };
  },

  /** Public website: active products of a category. */
  async listActiveByCategory(categoryId) {
    const [rows] = await pool.execute(
      "SELECT id, name, slug, title, short_description, list_img FROM products WHERE category_id = ? AND status = 'active' AND deleted_at IS NULL ORDER BY id",
      [categoryId],
    );
    return rows;
  },

  async findActiveBySlug(slug) {
    const [rows] = await pool.execute("SELECT * FROM products WHERE slug = ? AND status = 'active' AND deleted_at IS NULL LIMIT 1", [slug]);
    return rows[0] ?? null;
  },

  async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1", [id]);
    return rows[0] ?? null;
  },

  async images(productId) {
    const [rows] = await pool.execute("SELECT id, img, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order, id", [productId]);
    return rows;
  },

  async faqs(productId) {
    const [rows] = await pool.execute(
      "SELECT id, faq_question, faq_answer FROM product_faqs WHERE product_id = ? ORDER BY sort_order, id",
      [productId],
    );
    return rows;
  },

  async nameExists(name, excludeId = 0) {
    const [rows] = await pool.execute("SELECT 1 FROM products WHERE name = ? AND deleted_at IS NULL AND id <> ? LIMIT 1", [name, excludeId]);
    return rows.length > 0;
  },

  async slugExists(slug, excludeId = 0) {
    const [rows] = await pool.execute("SELECT 1 FROM products WHERE slug = ? AND deleted_at IS NULL AND id <> ? LIMIT 1", [slug, excludeId]);
    return rows.length > 0;
  },

  async insert(conn, data) {
    const [r] = await conn.execute(
      `INSERT INTO products (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`,
      COLUMNS.map((c) => data[c]),
    );
    return r.insertId;
  },

  async update(conn, id, data) {
    await conn.execute(`UPDATE products SET ${COLUMNS.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`, [...COLUMNS.map((c) => data[c]), id]);
  },

  async insertImage(conn, productId, img, sortOrder) {
    await conn.execute("INSERT INTO product_images (product_id, img, sort_order) VALUES (?, ?, ?)", [productId, img, sortOrder]);
  },

  async setImageOrder(conn, id, sortOrder) {
    await conn.execute("UPDATE product_images SET sort_order = ? WHERE id = ?", [sortOrder, id]);
  },

  async deleteImages(conn, ids) {
    if (!ids.length) return;
    await conn.execute(`DELETE FROM product_images WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
  },

  /** FAQs hold no files, so they are simply replaced by the submitted list. */
  async replaceFaqs(conn, productId, faqs) {
    await conn.execute("DELETE FROM product_faqs WHERE product_id = ?", [productId]);
    for (let i = 0; i < faqs.length; i++)
      await conn.execute("INSERT INTO product_faqs (product_id, faq_question, faq_answer, sort_order) VALUES (?, ?, ?, ?)", [
        productId,
        faqs[i].faq_question,
        faqs[i].faq_answer,
        i,
      ]);
  },

  async updateStatus(id, status) {
    const [r] = await pool.execute("UPDATE products SET status = ? WHERE id = ? AND deleted_at IS NULL", [status, id]);
    return r.affectedRows > 0;
  },

  async remove(id) {
    // Soft delete: the row, its images and FAQs are kept.
    const [r] = await pool.execute("UPDATE products SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", [id]);
    return r.affectedRows > 0;
  },
};
