import express from "express";
import { getTickets } from "./ticket.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getTicketsSchema } from "./ticket.schema.js";
import { authenticateJwt } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * GET /api/v1/tickets/get-data
 * Protected. Paginated ticket list with sort support.
 */
router.get(
  "/get-data",
  authenticateJwt,
  validate(getTicketsSchema, "query"),
  getTickets
);

export default router;
