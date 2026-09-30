import express from "express";
import {
  getTickets,
  getFilterOptions,
  getServiceRequestFormDetails,
  getTicketDetails,
  getTaskFormDetails,
  getTaskDetails,
  getSubmittedForm,
  logView,
  logDownload,
} from "./ticket.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getTicketsSchema,
  getFilterOptionsSchema,
  getTicketDetailsSchema,
  attachmentIdSchema,
} from "./ticket.schema.js";
import { authenticateJwt } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket list, filters, and details
 */

/** POST /api/v1/tickets/get-data — filtered, paginated ticket list
 * @swagger
 * /tickets/get-data:
 *   post:
 *     summary: Paginated ticket list
 *     tags: [Tickets]
 */
router.post(
  "/get-data",
  // authenticateJwt,
  validate(getTicketsSchema, "body"),
  getTickets
);

/** POST /api/v1/tickets/get-filter-options — dependent dropdown values
 * @swagger
 * /tickets/get-filter-options:
 *   post:
 *     summary: Get filter dropdown options
 *     tags: [Tickets]
 */
router.post(
  "/get-filter-options",
  // authenticateJwt,
  validate(getFilterOptionsSchema, "body"),
  getFilterOptions
);

/** POST /api/v1/tickets/get-service-request-form
 * @swagger
 * /tickets/get-service-request-form:
 *   post:
 *     summary: Get service request form details
 *     tags: [Tickets]
 */
router.post("/get-service-request-form", authenticateJwt, validate(getTicketDetailsSchema), getServiceRequestFormDetails);

/** POST /api/v1/tickets/get-details
 * @swagger
 * /tickets/get-details:
 *   post:
 *     summary: Get ticket details
 *     tags: [Tickets]
 */
router.post("/get-details",        authenticateJwt, validate(getTicketDetailsSchema), getTicketDetails);

/** POST /api/v1/tickets/get-task-form
 * @swagger
 * /tickets/get-task-form:
 *   post:
 *     summary: Get task form data
 *     tags: [Tickets]
 */
router.post("/get-task-form",      authenticateJwt, validate(getTicketDetailsSchema), getTaskFormDetails);

/** POST /api/v1/tickets/get-task-details
 * @swagger
 * /tickets/get-task-details:
 *   post:
 *     summary: Get task details
 *     tags: [Tickets]
 */
router.post("/get-task-details",   authenticateJwt, validate(getTicketDetailsSchema), getTaskDetails);

/** POST /api/v1/tickets/get-submitted-form
 * @swagger
 * /tickets/get-submitted-form:
 *   post:
 *     summary: Get submitted form data for a ticket
 *     tags: [Tickets]
 */
router.post("/get-submitted-form", authenticateJwt, validate(getTicketDetailsSchema), getSubmittedForm);

/** POST /api/v1/tickets/log-view — log who previewed an attachment
 * @swagger
 * /tickets/log-view:
 *   post:
 *     summary: Log attachment preview event
 *     tags: [Tickets]
 */
router.post("/log-view",      authenticateJwt, validate(attachmentIdSchema, "body"), logView);

/** POST /api/v1/tickets/log-download — increment attachment download_count
 * @swagger
 * /tickets/log-download:
 *   post:
 *     summary: Log attachment download event
 *     tags: [Tickets]
 */
router.post("/log-download",  authenticateJwt, validate(attachmentIdSchema, "body"), logDownload);

export default router;
