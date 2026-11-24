import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/db.js";
import { UPLOAD_ROOT } from "../services/image.service.js";
import { removeBackground } from "../utils/removeBackground.js";

/**
 * One-off: makes the solid background of existing product photos transparent (new uploads are handled on upload).
 *
 *   npm run products:transparent
 *
 * Each processed photo is saved as a new PNG and the database is pointed at it; the original files are left on disk.
 * Photos that are already transparent are only cropped to the product, so it is safe to re-run (each run adds new files).
 */
async function convert(rel) {
  const out = await removeBackground(await readFile(path.resolve(UPLOAD_ROOT, rel)));
  const next = `products/${randomBytes(16).toString("hex")}.png`;
  await writeFile(path.resolve(UPLOAD_ROOT, next), out, { flag: "wx" });
  return next;
}

async function main() {
  const targets = [
    { table: "products", column: "list_img" },
    { table: "product_images", column: "img" },
  ];
  let done = 0;
  for (const { table, column } of targets) {
    const [rows] = await pool.query(`SELECT id, \`${column}\` AS img FROM \`${table}\` WHERE \`${column}\` IS NOT NULL`);
    for (const row of rows) {
      try {
        const next = await convert(row.img);
        await pool.execute(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE id = ?`, [next, row.id]);
        done++;
      } catch (err) {
        console.error(`FAILED ${table}#${row.id} (${row.img}): ${err.message}`);
      }
    }
  }
  console.log(`Converted ${done} images`);
}

main()
  .catch((err) => {
    console.error("Failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
