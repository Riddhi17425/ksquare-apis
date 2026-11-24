import { pool } from "../config/db.js";
import { likeTerm } from "../utils/pagination.js";

const COLUMNS = ["state_name", "state_link", "map_img", "short_line", "status"];

export const presenceModel = {
  /** Soft-deleted rows (deleted_at set) are excluded everywhere. */
  async list({ page, limit, q, status }) {
    const where = ["p.deleted_at IS NULL"];
    const params = [];
    if (status) {
      where.push("p.status = ?");
      params.push(status);
    }
    if (q) {
      where.push("(p.state_name LIKE ? OR EXISTS (SELECT 1 FROM ksquare_presence_cities c WHERE c.presence_id = p.id AND c.city_name LIKE ?))");
      params.push(likeTerm(q), likeTerm(q));
    }
    const clause = `WHERE ${where.join(" AND ")}`;
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM ksquare_presences p ${clause}`, params);
    const [rows] = await pool.execute(
      `SELECT p.id, p.state_name, p.map_img, p.short_line, p.status, p.created_at,
              (SELECT COUNT(*) FROM ksquare_presence_cities c WHERE c.presence_id = p.id) AS city_count
         FROM ksquare_presences p ${clause} ORDER BY p.state_name, p.id LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params,
    );
    return { rows, total };
  },

  async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM ksquare_presences WHERE id = ? AND deleted_at IS NULL LIMIT 1", [id]);
    return rows[0] ?? null;
  },

  async cities(presenceId) {
    const [rows] = await pool.execute(
      "SELECT id, city_name, city_link FROM ksquare_presence_cities WHERE presence_id = ? ORDER BY sort_order, id",
      [presenceId],
    );
    return rows;
  },

  async stateExists(name, excludeId = 0) {
    const [rows] = await pool.execute("SELECT 1 FROM ksquare_presences WHERE state_name = ? AND deleted_at IS NULL AND id <> ? LIMIT 1", [name, excludeId]);
    return rows.length > 0;
  },

  async insert(conn, data) {
    const [r] = await conn.execute(
      `INSERT INTO ksquare_presences (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`,
      COLUMNS.map((c) => data[c]),
    );
    return r.insertId;
  },

  async update(conn, id, data) {
    await conn.execute(`UPDATE ksquare_presences SET ${COLUMNS.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`, [...COLUMNS.map((c) => data[c]), id]);
  },

  /** Cities hold no files, so they are simply replaced by the submitted list. */
  async replaceCities(conn, presenceId, cities) {
    await conn.execute("DELETE FROM ksquare_presence_cities WHERE presence_id = ?", [presenceId]);
    for (let i = 0; i < cities.length; i++)
      await conn.execute("INSERT INTO ksquare_presence_cities (presence_id, city_name, city_link, sort_order) VALUES (?, ?, ?, ?)", [
        presenceId,
        cities[i].city_name,
        cities[i].city_link,
        i,
      ]);
  },

  async remove(id) {
    const [r] = await pool.execute("UPDATE ksquare_presences SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", [id]);
    return r.affectedRows > 0;
  },
};
