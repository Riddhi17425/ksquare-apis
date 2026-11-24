import { Router } from "express";
import * as ctrl from "../../controllers/admin/auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { forgotPasswordLimiter, loginLimiter, resetPasswordLimiter } from "../../middleware/rateLimiters.js";
import { validate } from "../../middleware/validate.js";
import * as v from "../../validators/auth.validator.js";

const router = Router();

// Public (no session yet) - strictly rate limited
router.post("/login", loginLimiter, validate({ body: v.loginBody }), ctrl.login);
router.post("/forgot-password", forgotPasswordLimiter, validate({ body: v.forgotPasswordBody }), ctrl.forgotPassword);
router.get("/reset-password", resetPasswordLimiter, validate({ query: v.verifyResetQuery }), ctrl.verifyResetToken);
router.post("/reset-password", resetPasswordLimiter, validate({ body: v.resetPasswordBody }), ctrl.resetPassword);

// Authenticated
router.get("/me", authenticate, ctrl.me);
router.post("/logout", authenticate, ctrl.logout);

export default router;
