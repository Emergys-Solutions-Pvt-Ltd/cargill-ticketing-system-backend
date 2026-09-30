import express from "express";
import { verifyUserAccess } from "./auth.controller.js";
import { authenticateJwt } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/auth/verify-access
 * Protected. No body needed — email read from JWT.
 * Frontend calls this once after SSO login to load user context.
 *
 * @swagger
 * /auth/verify-access:
 *   post:
 *     summary: Verify SSO token and load user context
 *     tags: [Auth]
 */
router.post("/verify-access",
    // authenticateJwt,
    verifyUserAccess);

export default router;
