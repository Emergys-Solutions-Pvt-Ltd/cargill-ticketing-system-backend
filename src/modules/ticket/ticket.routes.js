import express from "express";
import { getTickets, getServiceRequestFormDetails } from "./ticket.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getTicketsSchema, getTicketDetailsSchema } from "./ticket.schema.js";
import { authenticateJwt } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/tickets/get-data
 * Protected. Paginated ticket list.
 * Body: { page, pageSize }
 */
router.post(
  "/get-data",
  authenticateJwt,
  validate(getTicketsSchema, "body"),
  getTickets
);

/**
 * POST /api/v1/tickets/get-service-request-form
 * Body: { ticketId: string }
 */
router.post(
  "/get-service-request-form",
  authenticateJwt,
  validate(getTicketDetailsSchema),
  getServiceRequestFormDetails
);

export default router;
