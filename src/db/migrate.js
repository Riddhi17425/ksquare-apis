import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { dbConfig } from "../config/db.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "migrations");

/** Applies every not-yet-applied migrations/*.sql file, in filename order, each in its own run. */
async function migrate() {
  const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
  try {
    await conn.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name VARCHAR(255) NOT NULL PRIMARY KEY,
         applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    const [rows] = await conn.query("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((r) => r.name));
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      console.log(`Applying ${file} ...`);
      await conn.query(await readFile(path.join(dir, file), "utf8"));
      await conn.execute("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
      count++;
    }
    console.log(count ? `Done: ${count} migration(s) applied.` : "Database is up to date.");
  } finally {
    await conn.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
