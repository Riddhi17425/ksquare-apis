import { pool } from "../config/db.js";
import { likeTerm } from "../utils/pagination.js";

export const testimonialModel = {
  async list({ page, limit, q }) {
    const where = q ? "WHERE name LIKE ? OR company LIKE ? OR description LIKE ?" : "";
    const params = q ? [likeTerm(q), likeTerm(q), likeTerm(q)] : [];
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM testimonials ${where}`, params);
    // limit/offset are integers validated by zod, inlined because some servers reject ? in LIMIT
    const [rows] = await pool.execute(
      `SELECT id, profile_photo, name, company, description, created_at
         FROM testimonials ${where} ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params,
    );
    return { rows, total };
  },

  async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM testimonials WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  },

  async create({ profile_photo, name, company, description }) {
    const [r] = await pool.execute(
      "INSERT INTO testimonials (profile_photo, name, company, description) VALUES (?, ?, ?, ?)",
      [profile_photo, name, company, description],
    );
    return r.insertId;
  },

  async update(id, { profile_photo, name, company, description }) {
    await pool.execute("UPDATE testimonials SET profile_photo = ?, name = ?, company = ?, description = ? WHERE id = ?", [
      profile_photo,
      name,
      company,
      description,
      id,
    ]);
  },

  async remove(id) {
    const [r] = await pool.execute("DELETE FROM testimonials WHERE id = ?", [id]);
    return r.affectedRows > 0;
  },
};
