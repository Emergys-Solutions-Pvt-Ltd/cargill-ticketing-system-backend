import express from "express";
import {
  getTickets,
  getServiceRequestFormDetails,
  getTicketDetails,
  getTaskFormDetails,
  getTaskDetails,
  getSubmittedForm,
} from "./ticket.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getTicketsSchema, getTicketDetailsSchema } from "./ticket.schema.js";
import { authenticateJwt } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/tickets/get-data
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

/**
 * POST /api/v1/tickets/get-details
 * Body: { ticketId: string }
 * Returns all accordion sections (action history, notes, approvals, etc.) for a ticket.
 */
router.post(
  "/get-details",
  authenticateJwt,
  validate(getTicketDetailsSchema),
  getTicketDetails
);

/**
 * POST /api/v1/tickets/get-task-form
 * Body: { ticketId: string }
 * Returns task form details (same shape as service request form).
 */
router.post(
  "/get-task-form",
  authenticateJwt,
  validate(getTicketDetailsSchema),
  getTaskFormDetails
);

/**
 * POST /api/v1/tickets/get-task-details
 * Body: { ticketId: string }
 * Returns all accordion sections for a task.
 */
router.post(
  "/get-task-details",
  authenticateJwt,
  validate(getTicketDetailsSchema),
  getTaskDetails
);

/**
 * POST /api/v1/tickets/get-submitted-form
 * Body: { ticketId: string }
 * Returns dynamically structured submitted form (header + field rows).
 */
router.post(
  "/get-submitted-form",
  authenticateJwt,
  validate(getTicketDetailsSchema),
  getSubmittedForm
);

export default router;
