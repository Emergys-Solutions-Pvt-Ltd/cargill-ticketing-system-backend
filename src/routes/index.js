import express from "express";

import healthRoutes from "../modules/health/health.routes.js";
import ticketRoutes  from "../modules/ticket/ticket.routes.js";
import ticket2Routes from "../modules/ticket/ticket2.routes.js";
import authRoutes   from "../modules/auth/auth.routes.js";
import rbacRoutes   from "../modules/rbac/rbac.routes.js";

const router = express.Router();

router.use("/health",  healthRoutes);
router.use("/tickets", ticketRoutes);
router.use("/tickets", ticket2Routes);
router.use("/auth",    authRoutes);
router.use("/rbac",    rbacRoutes);

export default router;
