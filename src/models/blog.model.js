import { pool } from "../config/db.js";
import { likeTerm } from "../utils/pagination.js";

const FIELDS = [
  "author_id",
  "title",
  "short_description",
  "description",
  "date",
  "front_image",
  "detail_image",
  "cta_text",
  "cta_image",
  "conclusion",
  "url",
  "status",
  "meta_title",
  "meta_description",
];

export const blogModel = {
  /** Soft-deleted blogs (deleted_at set) are excluded everywhere. */
  async list({ page, limit, q, status }) {
    const where = ["b.deleted_at IS NULL"];
    const params = [];
    if (status) {
      where.push("b.status = ?");
      params.push(status);
    }
    if (q) {
      where.push("(b.title LIKE ? OR b.url LIKE ? OR b.short_description LIKE ?)");
      params.push(likeTerm(q), likeTerm(q), likeTerm(q));
    }
    const clause = `WHERE ${where.join(" AND ")}`;
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM blogs b ${clause}`, params);
    const [rows] = await pool.execute(
      `SELECT b.id, b.title, b.short_description, b.url, b.status, b.\`date\`, b.front_image, b.created_at, b.updated_at,
              b.author_id, a.name AS author_name
         FROM blogs b LEFT JOIN admins a ON a.id = b.author_id
         ${clause} ORDER BY b.\`date\` DESC, b.id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params,
    );
    return { rows, total };
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT b.id, b.author_id, b.title, b.short_description, b.description, b.\`date\`, b.front_image, b.detail_image,
              b.cta_text, b.cta_image, b.conclusion, b.url, b.status, b.meta_title, b.meta_description,
              b.created_at, b.updated_at, b.deleted_at, a.name AS author_name
         FROM blogs b LEFT JOIN admins a ON a.id = b.author_id
        WHERE b.id = ? AND b.deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  },

  async urlExists(url, excludeId = 0) {
    const [rows] = await pool.execute("SELECT 1 FROM blogs WHERE url = ? AND deleted_at IS NULL AND id <> ? LIMIT 1", [
      url,
      excludeId,
    ]);
    return rows.length > 0;
  },

  async create(data) {
    const [r] = await pool.execute(
      `INSERT INTO blogs (${FIELDS.map((f) => `\`${f}\``).join(", ")}) VALUES (${FIELDS.map(() => "?").join(", ")})`,
      FIELDS.map((f) => data[f]),
    );
    return r.insertId;
  },

  async update(id, data) {
    await pool.execute(`UPDATE blogs SET ${FIELDS.map((f) => `\`${f}\` = ?`).join(", ")} WHERE id = ? AND deleted_at IS NULL`, [
      ...FIELDS.map((f) => data[f]),
      id,
    ]);
  },

  async updateStatus(id, status) {
    const [r] = await pool.execute("UPDATE blogs SET status = ? WHERE id = ? AND deleted_at IS NULL", [status, id]);
    return r.affectedRows > 0;
  },

  /** Soft delete. Returns false when the blog does not exist or is already deleted. */
  async softDelete(id) {
    const [r] = await pool.execute("UPDATE blogs SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", [id]);
    return r.affectedRows > 0;
  },
};
