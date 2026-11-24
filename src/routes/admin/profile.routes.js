import { Router } from "express";
import * as ctrl from "../../controllers/admin/profile.controller.js";
import { resetPasswordLimiter } from "../../middleware/rateLimiters.js";
import { validate } from "../../middleware/validate.js";
import * as v from "../../validators/profile.validator.js";

const router = Router(); // already behind authenticate (see routes/admin/index.js)

router.get("/", ctrl.get);
router.put("/", validate({ body: v.profileBody }), ctrl.update);
router.put("/password", resetPasswordLimiter, validate({ body: v.changePasswordBody }), ctrl.changePassword); // limited: it checks a password

export default router;
