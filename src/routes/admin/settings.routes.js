import { Router } from "express";
import * as ctrl from "../../controllers/admin/settings.controller.js";
import { validate } from "../../middleware/validate.js";
import { settingsBody } from "../../validators/settings.validator.js";

const router = Router();

// Site settings are a single record: read it, replace it.
router.get("/", ctrl.get);
router.put("/", validate({ body: settingsBody }), ctrl.update);

export default router;
