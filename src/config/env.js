import "dotenv/config";
import { z } from "zod";

const bool = z.enum(["true", "false"]).default("false").transform((v) => v === "true");
const int = (def) => z.coerce.number().int().positive().default(def);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: int(4000),

  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: int(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().min(1),

  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  ADMIN_APP_URL: z.string().url().default("http://localhost:3000"),

  // Uploaded images are stored on disk here and served from /uploads
  UPLOAD_DIR: z.string().default("uploads"),
  API_PUBLIC_URL: z.string().url().default("http://localhost:4000"),

  SESSION_TTL_MINUTES: int(480),
  SESSION_IDLE_MINUTES: int(120),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  MAX_LOGIN_ATTEMPTS: int(5),
  LOCKOUT_MINUTES: int(15),

  // Per-IP request caps (production defaults; raise them locally while testing)
  LOGIN_RATE_LIMIT: int(20), // per 15 minutes
  FORGOT_PASSWORD_RATE_LIMIT: int(5), // per hour

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: int(587),
  SMTP_SECURE: bool,
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("Ksquare Admin <no-reply@localhost>"),

  SEED_ADMIN_NAME: z.string().default("Administrator"),
  SEED_ADMIN_EMAIL: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) console.error(` - ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

const e = parsed.data;

export const env = {
  ...e,
  isProd: e.NODE_ENV === "production",
  corsOrigins: e.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean),
};
