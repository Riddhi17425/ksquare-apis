import { pool } from "../config/db.js";

export const enquiryModel = {
  async create({ name, email, phone, subject, message, ip }) {
    const [result] = await pool.execute(
      "INSERT INTO enquiries (name, email, phone, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, phone, subject, message, ip?.slice(0, 45) ?? null],
    );
    return result.insertId;
  },

  async list({ page, limit, status, q }) {
    const where = [];
    const params = [];
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (q) {
      where.push("(name LIKE ? OR email LIKE ? OR subject LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM enquiries ${clause}`, params);
    // limit/offset are integers already validated by zod; they are inlined because some servers reject ? in LIMIT.
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, subject, status, created_at
         FROM enquiries ${clause} ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    return { rows, total };
  },

  async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM enquiries WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  },

  async updateStatus(id, status) {
    const [result] = await pool.execute("UPDATE enquiries SET status = ? WHERE id = ?", [status, id]);
    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await pool.execute("DELETE FROM enquiries WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  async countsByStatus() {
    const [rows] = await pool.execute("SELECT status, COUNT(*) AS count FROM enquiries GROUP BY status");
    const counts = { new: 0, in_progress: 0, resolved: 0 };
    for (const r of rows) counts[r.status] = Number(r.count);
    return { ...counts, total: counts.new + counts.in_progress + counts.resolved };
  },
};
