import { Router } from "express";
import * as ctrl from "../../controllers/admin/pageContent.controller.js";
import { uploadImages } from "../../middleware/upload.js";
import { validate } from "../../middleware/validate.js";
import { projectsPageBody, PROJECTS_STEPS } from "../../validators/pageContent.validator.js";

const router = Router(); // already behind authenticate (see routes/admin/index.js)

// One optional icon per process step, sent as the file steps_icon_<row number> (JSON requests without files still work).
const stepIcons = Array.from({ length: PROJECTS_STEPS }, (_, i) => `steps_icon_${i}`);
const iconLabels = Object.fromEntries(stepIcons.map((n, i) => [n, `Step ${i + 1} icon`]));

router.get("/projects", ctrl.getProjects);
router.put("/projects", uploadImages(stepIcons), validate({ body: projectsPageBody, images: { all: stepIcons, labels: iconLabels } }), ctrl.saveProjects);

export default router;
