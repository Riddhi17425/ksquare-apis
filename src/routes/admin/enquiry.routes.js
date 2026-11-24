import { Router } from "express";
import * as ctrl from "../../controllers/admin/enquiry.controller.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { idParams } from "../../validators/common.validator.js";
import * as v from "../../validators/enquiry.validator.js";

const router = Router();

router.get("/", validate({ query: v.listEnquiriesQuery }), ctrl.list);
router.get("/stats", ctrl.stats);
router.get("/:id", validate({ params: idParams }), ctrl.get);
router.patch("/:id/status", validate({ params: idParams, body: v.updateEnquiryStatusBody }), ctrl.updateStatus);
router.delete("/:id", authorize("super_admin"), validate({ params: idParams }), ctrl.remove);

export default router;
