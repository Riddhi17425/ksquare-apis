import { pool } from "../config/db.js";

export const settingsModel = {
  async get() {
    const [[row]] = await pool.execute(
      "SELECT facebook_link, instagram_link, linkedin_link, updated_at FROM settings WHERE id = 1",
    );
    const [entries] = await pool.execute("SELECT id, type, value FROM setting_entries WHERE setting_id = 1 ORDER BY sort_order, id");
    return { row, entries };
  },

  async updateLinks(conn, { facebook_link, instagram_link, linkedin_link }) {
    await conn.execute("UPDATE settings SET facebook_link = ?, instagram_link = ?, linkedin_link = ? WHERE id = 1", [
      facebook_link,
      instagram_link,
      linkedin_link,
    ]);
  },

  /** Replaces all entries with the submitted lists (what the form shows is what is stored). */
  async replaceEntries(conn, byType) {
    await conn.execute("DELETE FROM setting_entries WHERE setting_id = 1");
    for (const [type, values] of Object.entries(byType))
      for (let i = 0; i < values.length; i++)
        await conn.execute("INSERT INTO setting_entries (setting_id, type, value, sort_order) VALUES (1, ?, ?, ?)", [type, values[i], i]);
  },
};
