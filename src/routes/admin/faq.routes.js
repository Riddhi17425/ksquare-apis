import { Router } from "express";
import * as ctrl from "../../controllers/admin/faq.controller.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { idParams } from "../../validators/common.validator.js";
import * as v from "../../validators/faq.validator.js";

const router = Router();

router.get("/", validate({ query: v.listFaqsQuery }), ctrl.list);
router.post("/", validate({ body: v.createFaqsBody }), ctrl.create); // several Q&As under one category
router.get("/:id", validate({ params: idParams }), ctrl.get);
router.put("/:id", validate({ params: idParams, body: v.updateFaqBody }), ctrl.update);
router.delete("/:id", authorize("super_admin"), validate({ params: idParams }), ctrl.remove);

export default router;
