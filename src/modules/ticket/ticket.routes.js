import express from "express";
import { getTickets, getFilterOptions } from "./ticket.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getTicketsSchema, getFilterOptionsSchema } from "./ticket.schema.js";
import { authenticateJwt } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/tickets/get-data
 * Protected. Paginated + filtered ticket list.
 * Body: { page, pageSize, queue[], status[], ... }
 */
router.post(
  "/get-data",
  authenticateJwt,
  validate(getTicketsSchema, "body"),
  getTickets
);

/**
 * POST /api/v1/tickets/filter-options
 * Protected. Returns dependent dropdown values for all filter fields.
 * Body: same filter fields as get-data (no pagination).
 * Call on page load and on every filter change.
 */
router.post(
  "/filter-options",
  authenticateJwt,
  validate(getFilterOptionsSchema, "body"),
  getFilterOptions
);

export default router;
