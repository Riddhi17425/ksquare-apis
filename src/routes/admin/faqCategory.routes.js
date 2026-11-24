import { Router } from "express";
import * as ctrl from "../../controllers/admin/faqCategory.controller.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { idParams } from "../../validators/common.validator.js";
import * as v from "../../validators/faq.validator.js";

const router = Router();

router.get("/", validate({ query: v.listFaqCategoriesQuery }), ctrl.list);
router.get("/options", ctrl.options); // active + non-deleted only; before /:id
router.post("/", validate({ body: v.faqCategoryBody }), ctrl.create);
router.get("/:id", validate({ params: idParams }), ctrl.get);
router.put("/:id", validate({ params: idParams, body: v.faqCategoryBody }), ctrl.update);
router.patch("/:id/status", validate({ params: idParams, body: v.faqCategoryStatusBody }), ctrl.updateStatus);
router.delete("/:id", authorize("super_admin"), validate({ params: idParams }), ctrl.remove);

export default router;
