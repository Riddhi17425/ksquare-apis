import { authService } from "../../services/auth.service.js";
import { ok } from "../../utils/response.js";

export const login = async (req, res) => {
  const { email, password } = req.valid.body;
  const result = await authService.login({ email, password, ip: req.ip, userAgent: req.get("user-agent") });
  ok(res, result, { message: "Signed in" });
};

export const logout = async (req, res) => {
  await authService.logout(req.sessionId);
  ok(res, null, { message: "Signed out" });
};

export const me = (req, res) => ok(res, { admin: req.admin });

export const forgotPassword = async (req, res) => {
  const { devResetLink } = await authService.forgotPassword(req.valid.body.email);
  ok(res, { devResetLink }, { message: "A password reset link has been sent to your email." });
};

export const verifyResetToken = async (req, res) =>
  ok(res, { valid: await authService.verifyResetToken(req.valid.query.token) });

export const resetPassword = async (req, res) => {
  await authService.resetPassword(req.valid.body.token, req.valid.body.password);
  ok(res, null, { message: "Password updated. Please sign in." });
};
