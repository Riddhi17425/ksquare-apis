import { Router } from "express";
import * as blogCtrl from "../../controllers/frontend/blog.controller.js";
import * as catalogCtrl from "../../controllers/frontend/catalog.controller.js";
import * as downloadCtrl from "../../controllers/frontend/download.controller.js";
import * as faqCtrl from "../../controllers/frontend/faq.controller.js";
import * as projectCtrl from "../../controllers/frontend/project.controller.js";
import * as awardCtrl from "../../controllers/frontend/award.controller.js";
import * as presenceCtrl from "../../controllers/frontend/presence.controller.js";
import * as lifeCtrl from "../../controllers/frontend/lifeAtKsquare.controller.js";
import * as testimonialCtrl from "../../controllers/frontend/testimonial.controller.js";
import * as pressCtrl from "../../controllers/frontend/pressRelease.controller.js";
import * as eventCtrl from "../../controllers/frontend/event.controller.js";
import * as settingsCtrl from "../../controllers/frontend/settings.controller.js";
import * as ctrl from "../../controllers/frontend/enquiry.controller.js";
import { publicFormLimiter } from "../../middleware/rateLimiters.js";
import { validate } from "../../middleware/validate.js";
import { publicBlogParams } from "../../validators/blog.validator.js";
import { listQuery } from "../../validators/common.validator.js";
import { slugParams } from "../../validators/common.validator.js";
import { createEnquiryBody } from "../../validators/enquiry.validator.js";

const router = Router();

// Public website API (no authentication)
router.post("/enquiries", publicFormLimiter, validate({ body: createEnquiryBody }), ctrl.submit);
router.get("/blogs", validate({ query: listQuery }), blogCtrl.list);
router.get("/blogs/:url", validate({ params: publicBlogParams }), blogCtrl.get);
router.get("/faqs", faqCtrl.list);
router.get("/downloads", downloadCtrl.list);
router.get("/projects", projectCtrl.list);
router.get("/awards", awardCtrl.list);
router.get("/presence", presenceCtrl.list);
router.get("/life-at-ksquare", lifeCtrl.list);
router.get("/testimonials", testimonialCtrl.list);
router.get("/press-releases", pressCtrl.list);
router.get("/events", eventCtrl.list);
router.get("/settings", settingsCtrl.get);
router.get("/categories", catalogCtrl.categories);
router.get("/categories/:slug", validate({ params: slugParams }), catalogCtrl.category);
router.get("/products/:slug", validate({ params: slugParams }), catalogCtrl.product);

export default router;
