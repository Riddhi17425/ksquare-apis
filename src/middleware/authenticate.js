import { env } from "../config/env.js";
import { sessionModel } from "../models/session.model.js";
import { ApiError } from "../utils/ApiError.js";
import { hashToken } from "../utils/token.js";

/**
 * Requires a valid admin session: `Authorization: Bearer <token>`.
 * The token is looked up (by hash) in admin_sessions, which enforces absolute + idle expiry
 * and that the admin account is still active. Sets req.admin and req.sessionId.
 */
export async function authenticate(req, _res, next) {
  const [scheme, token] = (req.get("authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token) throw ApiError.unauthorized();

  const session = await sessionModel.findActive(hashToken(token), env.SESSION_IDLE_MINUTES);
  if (!session) throw ApiError.unauthorized("Session expired. Please sign in again.", { code: "SESSION_EXPIRED" });

  await sessionModel.touch(session.id);
  req.sessionId = session.id;
  req.admin = { id: session.admin_id, name: session.name, email: session.email, role: session.role };
  next();
}
