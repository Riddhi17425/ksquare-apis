import bcrypt from "bcryptjs";
import { withTransaction } from "../config/db.js";
import { env } from "../config/env.js";
import { adminModel } from "../models/admin.model.js";
import { sessionModel } from "../models/session.model.js";
import { ApiError } from "../utils/ApiError.js";

const fieldError = (field, message) => new ApiError(422, message, { code: "VALIDATION_ERROR", errors: [{ field, message }] });

export const profileService = {
  async get(adminId) {
    const profile = await adminModel.findProfile(adminId);
    if (!profile) throw ApiError.notFound("Profile not found");
    return profile;
  },

  async update(adminId, { name, email }) {
    if (await adminModel.emailTaken(email, adminId)) throw fieldError("email", "This email is already used by another admin");
    await adminModel.updateProfile(adminId, { name, email });
    return this.get(adminId);
  },

  /** Verifies the current password, sets the new one and signs out every OTHER session (this one stays). */
  async changePassword(adminId, sessionId, { current_password, password }) {
    const admin = await adminModel.findPasswordHash(adminId);
    if (!admin || !(await bcrypt.compare(current_password, admin.password_hash))) throw fieldError("current_password", "Current password is incorrect");
    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    await withTransaction(async (conn) => {
      await adminModel.updatePassword(adminId, hash, conn);
      await sessionModel.deleteOthers(adminId, sessionId, conn);
    });
  },
};
