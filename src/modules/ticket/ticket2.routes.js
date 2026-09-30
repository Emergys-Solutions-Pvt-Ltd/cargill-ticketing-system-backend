import express from "express";
import { getTickets2 } from "./ticket2.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getTickets2Schema } from "./ticket2.schema.js";
// import { authenticateJwt } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/tickets/get-data-v2
 *
 * Paginated ticket list with multi-level sorting support.
 *
 * Body:
 *   {
 *     page:     number   (default 1)
 *     pageSize: number   (default 10, max 100)
 *     sort:     [{ col: string, dir: "asc"|"desc" }]   (optional, up to 5 levels)
 *     ...same filter fields as /get-data
 *   }
 *
 * @swagger
 * /tickets/get-data-v2:
 *   post:
 *     summary: Paginated ticket list with multi-level sorting
 *     tags: [Tickets v2]
 */
router.post(
  "/get-data-v2",
  // authenticateJwt,
  validate(getTickets2Schema, "body"),
  getTickets2
);

export default router;
