import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { pool } from "../config/db.js";
import { passwordSchema } from "../validators/common.validator.js";

/** Creates the first super admin from SEED_ADMIN_* env vars. Safe to re-run: existing accounts are left untouched. */
async function seed() {
  const email = env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !env.SEED_ADMIN_PASSWORD) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env");

  const check = passwordSchema.safeParse(env.SEED_ADMIN_PASSWORD);
  if (!check.success) throw new Error(`SEED_ADMIN_PASSWORD too weak: ${check.error.issues[0].message}`);

  const [existing] = await pool.execute("SELECT id FROM admins WHERE email = ?", [email]);
  if (existing.length) {
    console.log(`Admin ${email} already exists - nothing to do.`);
    return;
  }
  const hash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, env.BCRYPT_ROUNDS);
  await pool.execute("INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, 'super_admin')", [
    env.SEED_ADMIN_NAME,
    email,
    hash,
  ]);
  console.log(`Super admin ${email} created.`);
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
