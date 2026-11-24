import { pool } from "../config/db.js";
import { likeTerm } from "../utils/pagination.js";
import { byTable, fkAlias } from "./resources.js";

// Table and column names below come from resources.js only (never from requests), so they are safe to interpolate.
const col = (name) => `\`${name}\``;

/** SQL access for one resource. Soft-deleted rows (deleted_at set) are excluded everywhere. */
export function createModel(res) {
  const fks = res.fields.filter((f) => f.type === "fk");
  const columns = ["status", ...res.fields.map((f) => f.name)];

  // Dates come back as plain "YYYY-MM-DD" strings (no timezone shifts); fks also return the referenced row's label.
  const select = [
    "t.id",
    "t.status",
    "t.created_at",
    "t.updated_at",
    ...res.fields.map((f) => (f.type === "date" ? `DATE_FORMAT(t.${col(f.name)}, '%Y-%m-%d') AS ${col(f.name)}` : `t.${col(f.name)}`)),
    ...fks.map((f, i) => `j${i}.${col(byTable[f.ref].labelField)} AS ${col(fkAlias(f))}`),
  ].join(", ");
  const from = `${col(res.table)} t ${fks.map((f, i) => `LEFT JOIN ${col(f.ref)} j${i} ON j${i}.id = t.${col(f.name)}`).join(" ")}`;

  return {
    async list({ page, limit, q, status, ...filters }) {
      const where = ["t.deleted_at IS NULL"];
      const params = [];
      if (status) {
        where.push("t.status = ?");
        params.push(status);
      }
      for (const f of fks)
        if (filters[f.name]) {
          where.push(`t.${col(f.name)} = ?`);
          params.push(filters[f.name]);
        }
      if (q && res.search.length) {
        where.push(`(${res.search.map((c) => `t.${col(c)} LIKE ?`).join(" OR ")})`);
        params.push(...res.search.map(() => likeTerm(q)));
      }
      const clause = `WHERE ${where.join(" AND ")}`;
      const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM ${col(res.table)} t ${clause}`, params);
      const [rows] = await pool.execute(
        `SELECT ${select} FROM ${from} ${clause} ORDER BY ${res.orderBy} LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
        params,
      );
      return { rows, total };
    },

    async findById(id) {
      const [rows] = await pool.execute(`SELECT ${select} FROM ${from} WHERE t.id = ? AND t.deleted_at IS NULL LIMIT 1`, [id]);
      return rows[0] ?? null;
    },

    /** Active rows only: what the dropdowns of other modules offer. */
    async options() {
      const label = col(res.labelField);
      const [rows] = await pool.execute(
        `SELECT id, ${label} AS label FROM ${col(res.table)} WHERE status = 'active' AND deleted_at IS NULL ORDER BY ${label}, id`,
      );
      return rows;
    },

    async valueExists(column, value, excludeId = 0) {
      const [rows] = await pool.execute(
        `SELECT 1 FROM ${col(res.table)} WHERE ${col(column)} = ? AND deleted_at IS NULL AND id <> ? LIMIT 1`,
        [value, excludeId],
      );
      return rows.length > 0;
    },

    /** Is `id` an active, non-deleted row of the referenced table? */
    async refIsActive(table, id) {
      const [rows] = await pool.execute(`SELECT 1 FROM ${col(table)} WHERE id = ? AND status = 'active' AND deleted_at IS NULL LIMIT 1`, [id]);
      return rows.length > 0;
    },

    /** How many non-deleted rows of another table point at this row. */
    async countUsing({ table, column }, id) {
      const [[{ n }]] = await pool.execute(`SELECT COUNT(*) AS n FROM ${col(table)} WHERE ${col(column)} = ? AND deleted_at IS NULL`, [id]);
      return n;
    },

    async insert(data) {
      const [r] = await pool.execute(
        `INSERT INTO ${col(res.table)} (${columns.map(col).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
        columns.map((c) => data[c] ?? null),
      );
      return r.insertId;
    },

    async update(id, data) {
      await pool.execute(
        `UPDATE ${col(res.table)} SET ${columns.map((c) => `${col(c)} = ?`).join(", ")} WHERE id = ? AND deleted_at IS NULL`,
        [...columns.map((c) => data[c] ?? null), id],
      );
    },

    async updateStatus(id, status) {
      const [r] = await pool.execute(`UPDATE ${col(res.table)} SET status = ? WHERE id = ? AND deleted_at IS NULL`, [status, id]);
      return r.affectedRows > 0;
    },

    async softDelete(id) {
      const [r] = await pool.execute(`UPDATE ${col(res.table)} SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`, [id]);
      return r.affectedRows > 0;
    },
  };
}
