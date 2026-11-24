import { Router } from "express";
import * as ctrl from "../../controllers/admin/testimonial.controller.js";
import { authorize } from "../../middleware/authorize.js";
import { uploadImages } from "../../middleware/upload.js";
import { validate } from "../../middleware/validate.js";
import { idParams, listQuery } from "../../validators/common.validator.js";
import { testimonialBody, testimonialImages } from "../../validators/testimonial.validator.js";

const router = Router();
const upload = uploadImages(testimonialImages.all);
const writeSchema = { body: testimonialBody, images: testimonialImages };

router.get("/", validate({ query: listQuery }), ctrl.list);
router.post("/", upload, validate(writeSchema), ctrl.create);
router.get("/:id", validate({ params: idParams }), ctrl.get);
router.put("/:id", upload, validate({ params: idParams, ...writeSchema }), ctrl.update);
router.delete("/:id", authorize("super_admin"), validate({ params: idParams }), ctrl.remove);

export default router;
