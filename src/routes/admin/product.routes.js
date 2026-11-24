import { Router } from "express";
import * as ctrl from "../../controllers/admin/product.controller.js";
import { authorize } from "../../middleware/authorize.js";
import { uploadImages } from "../../middleware/upload.js";
import { validate } from "../../middleware/validate.js";
import { idParams } from "../../validators/common.validator.js";
import * as v from "../../validators/product.validator.js";

const router = Router();
const upload = uploadImages(["list_img", ...v.DETAIL_IMG_FIELDS]);

router.get("/", validate({ query: v.listProductsQuery }), ctrl.list);
router.post("/", upload, validate({ body: v.productBody, images: v.productCreateImages }), ctrl.create);
router.get("/:id", validate({ params: idParams }), ctrl.get);
router.put("/:id", upload, validate({ params: idParams, body: v.productBody, images: v.productUpdateImages }), ctrl.update);
router.delete("/:id", authorize("super_admin"), validate({ params: idParams }), ctrl.remove);

export default router;
