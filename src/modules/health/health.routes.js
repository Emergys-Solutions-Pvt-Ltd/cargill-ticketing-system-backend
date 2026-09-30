import express from "express";
import { getHealth } from "./health.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: API liveness check
 *
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is alive
 */
router.get("/", getHealth);

export default router;
