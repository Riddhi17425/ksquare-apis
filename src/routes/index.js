import { Router } from "express";
import adminRoutes from "./admin/index.js";
import frontendRoutes from "./frontend/index.js";

const router = Router();

router.use("/frontend", frontendRoutes);
router.use("/admin", adminRoutes);

export default router;
