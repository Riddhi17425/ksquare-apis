import mysql from "mysql2/promise";
import { env } from "./env.js";

export const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: "utf8mb4",
  timezone: "Z",
  dateStrings: ["DATE"], // DATE columns come back as "YYYY-MM-DD" instead of a timezone-shifted Date
};

export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Every connection runs in UTC so NOW() / DATETIME comparisons are consistent.
pool.pool.on("connection", (conn) => conn.query("SET time_zone = '+00:00'"));

/** Runs `fn(connection)` inside a transaction; commits on success, rolls back on any error. */
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function pingDb() {
  await pool.query("SELECT 1");
}
