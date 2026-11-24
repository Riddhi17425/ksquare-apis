import { Router } from "express";
import * as ctrl from "../../controllers/frontend/enquiry.controller.js";
import { publicFormLimiter } from "../../middleware/rateLimiters.js";
import { validate } from "../../middleware/validate.js";
import { createEnquiryBody } from "../../validators/enquiry.validator.js";

const router = Router();

// Public website API (no authentication)
router.post("/enquiries", publicFormLimiter, validate({ body: createEnquiryBody }), ctrl.submit);

export default router;
