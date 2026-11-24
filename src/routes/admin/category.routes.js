import { Router } from "express";
import * as ctrl from "../../controllers/admin/category.controller.js";
import { authorize } from "../../middleware/authorize.js";
import { uploadImages } from "../../middleware/upload.js";
import { validate } from "../../middleware/validate.js";
import * as v from "../../validators/category.validator.js";
import { idParams, listQuery } from "../../validators/common.validator.js";

const router = Router();
const upload = uploadImages([...v.CATEGORY_ALL_IMAGES, ...v.CONFIG_ICON_FIELDS]);

router.get("/", validate({ query: listQuery }), ctrl.list);
router.post("/", upload, validate({ body: v.categoryBody, images: v.categoryCreateImages }), ctrl.create);
router.get("/:id", validate({ params: idParams }), ctrl.get);
router.put("/:id", upload, validate({ params: idParams, body: v.categoryBody, images: v.categoryUpdateImages }), ctrl.update);
router.delete("/:id", authorize("super_admin"), validate({ params: idParams }), ctrl.remove);

export default router;
