import { Router } from "express";
import * as ctrl from "../../controllers/admin/presence.controller.js";
import { authorize } from "../../middleware/authorize.js";
import { uploadImages } from "../../middleware/upload.js";
import { validate } from "../../middleware/validate.js";
import { idParams } from "../../validators/common.validator.js";
import * as v from "../../validators/presence.validator.js";

const router = Router();
const upload = uploadImages(["map_img"]);

router.get("/", validate({ query: v.listPresencesQuery }), ctrl.list);
router.post("/", upload, validate({ body: v.presenceBody, images: v.presenceCreateImages }), ctrl.create);
router.get("/:id", validate({ params: idParams }), ctrl.get);
router.put("/:id", upload, validate({ params: idParams, body: v.presenceBody, images: v.presenceUpdateImages }), ctrl.update);
router.delete("/:id", authorize("super_admin"), validate({ params: idParams }), ctrl.remove);

export default router;
