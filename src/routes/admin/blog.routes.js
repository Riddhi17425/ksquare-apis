import { Router } from "express";
import * as ctrl from "../../controllers/admin/blog.controller.js";
import { authorize } from "../../middleware/authorize.js";
import { uploadImages } from "../../middleware/upload.js";
import { validate } from "../../middleware/validate.js";
import * as v from "../../validators/blog.validator.js";
import { idParams } from "../../validators/common.validator.js";

const router = Router();
const upload = uploadImages(v.BLOG_IMAGES);

router.get("/", validate({ query: v.listBlogsQuery }), ctrl.list);
router.get("/check-url", validate({ query: v.checkUrlQuery }), ctrl.checkUrl); // before /:id
router.post("/", upload, validate({ body: v.blogBody, images: v.blogCreateImages }), ctrl.create);
router.get("/:id", validate({ params: idParams }), ctrl.get);
router.put("/:id", upload, validate({ params: idParams, body: v.blogBody, images: v.blogUpdateImages }), ctrl.update);
router.patch("/:id/status", validate({ params: idParams, body: v.blogStatusBody }), ctrl.updateStatus);
router.delete("/:id", authorize("super_admin"), validate({ params: idParams }), ctrl.remove);

export default router;
