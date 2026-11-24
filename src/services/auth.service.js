import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { withTransaction } from "../config/db.js";
import { adminModel } from "../models/admin.model.js";
import { passwordResetModel } from "../models/passwordReset.model.js";
import { sessionModel } from "../models/session.model.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { generateToken, hashToken } from "../utils/token.js";
import { mailConfigured, sendPasswordResetEmail } from "./mail.service.js";

const RESET_TTL_MINUTES = 30;
const INVALID_CREDENTIALS = "Invalid email or password";

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", env.BCRYPT_ROUNDS);

export const authService = {
  async login({ email, password, ip, userAgent }) {
    const admin = await adminModel.findByEmail(email);

    if (admin?.is_locked) {
      throw ApiError.tooMany("Too many failed attempts. Please try again later.", { code: "ACCOUNT_LOCKED" });
    }

    const passwordOk = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH);
    if (!admin || !admin.is_active || !passwordOk) {
      if (admin) await adminModel.recordFailedLogin(admin.id, env.MAX_LOGIN_ATTEMPTS, env.LOCKOUT_MINUTES);
      throw ApiError.unauthorized(INVALID_CREDENTIALS, { code: "INVALID_CREDENTIALS" });
    }

    await adminModel.recordSuccessfulLogin(admin.id);
    // Housekeeping: drop dead sessions / reset tokens occasionally (cheap, indexed).
    sessionModel.deleteExpired(env.SESSION_IDLE_MINUTES).catch((e) => logger.warn("session cleanup failed", e.message));
    passwordResetModel.deleteExpired().catch((e) => logger.warn("reset cleanup failed", e.message));

    const token = generateToken();
    await sessionModel.create({
      adminId: admin.id,
      tokenHash: hashToken(token),
      ip,
      userAgent,
      ttlMinutes: env.SESSION_TTL_MINUTES,
    });

    return {
      token,
      expiresIn: env.SESSION_TTL_MINUTES * 60,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    };
  },

  async logout(sessionId) {
    await sessionModel.deleteById(sessionId);
  },

  /**
   * Tells the caller when no admin account matches (product decision: clearer UX over hiding account existence).
   * The endpoint stays protected by a strict per-IP rate limit to limit email probing.
   */
  async forgotPassword(email) {
    const admin = await adminModel.findByEmail(email);
    if (!admin || !admin.is_active) {
      throw ApiError.notFound("No admin account found with this email address", { code: "ADMIN_NOT_FOUND" });
    }

    const token = generateToken();
    await passwordResetModel.createFor(admin.id, hashToken(token), RESET_TTL_MINUTES);
    const link = `${env.ADMIN_APP_URL}/admin/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(admin.email, link, RESET_TTL_MINUTES);
    } catch (err) {
      logger.error("Failed to send reset email", err.message);
      throw new ApiError(502, "We couldn't send the reset email. Please try again later.", { code: "MAIL_FAILED" });
    }
    // Convenience for local development only, when no mail server is configured.
    return { devResetLink: !env.isProd && !mailConfigured ? link : undefined };
  },

  verifyResetToken: (token) => passwordResetModel.isValid(hashToken(token)),

  async resetPassword(token, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await withTransaction(async (conn) => {
      const adminId = await passwordResetModel.consume(hashToken(token), conn);
      if (!adminId) throw ApiError.badRequest("This reset link is invalid or has expired", { code: "INVALID_RESET_TOKEN" });
      await adminModel.updatePassword(adminId, passwordHash, conn);
      await sessionModel.deleteAllForAdmin(adminId, conn); // sign out everywhere
    });
  },
};
