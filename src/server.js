import { app } from "./app.js";
import { env } from "./config/env.js";
import { pingDb, pool } from "./config/db.js";
import { logger } from "./utils/logger.js";

try {
  await pingDb();
  logger.info(`MySQL connected (${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME})`);
} catch (err) {
  logger.error("Cannot connect to MySQL:", err.message);
  process.exit(1);
}

const server = app.listen(env.PORT, () => logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`));

const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => logger.error("Unhandled rejection:", reason));
