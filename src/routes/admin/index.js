import { Router } from "express";
import * as authors from "../../controllers/admin/author.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { createCrudRouter } from "../../crud/router.js";
import { RESOURCES } from "../../crud/resources.js";
import authRoutes from "./auth.routes.js";
import blogRoutes from "./blog.routes.js";
import categoryRoutes from "./category.routes.js";
import enquiryRoutes from "./enquiry.routes.js";
import faqCategoryRoutes from "./faqCategory.routes.js";
import faqRoutes from "./faq.routes.js";
import pageContentRoutes from "./pageContent.routes.js";
import profileRoutes from "./profile.routes.js";
import presenceRoutes from "./presence.routes.js";
import productRoutes from "./product.routes.js";
import settingsRoutes from "./settings.routes.js";
import testimonialRoutes from "./testimonial.routes.js";

const router = Router();

router.use("/auth", authRoutes); // login / forgot / reset are public; the rest of that router self-protects

// Everything registered below requires a valid admin session.
router.use(authenticate);
router.get("/authors", authors.list);
router.use("/profile", profileRoutes);
router.use("/page-content", pageContentRoutes);
router.use("/enquiries", enquiryRoutes);
router.use("/testimonials", testimonialRoutes);
router.use("/blogs", blogRoutes);
router.use("/categories", categoryRoutes);
router.use("/settings", settingsRoutes);
router.use("/faq-categories", faqCategoryRoutes);
router.use("/faqs", faqRoutes);
router.use("/products", productRoutes);
router.use("/ksquare-presences", presenceRoutes);
// Config-driven modules (blog authors, certificates, awards, events, press releases, careers, life at Ksquare, projects)
for (const resource of RESOURCES) router.use(`/${resource.slug}`, createCrudRouter(resource));

export default router;
