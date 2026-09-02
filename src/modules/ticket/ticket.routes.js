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

/** POST /api/v1/tickets/get-data — filtered, paginated ticket list */
router.post(
  "/get-data",
  // authenticateJwt,
  validate(getTicketsSchema, "body"),
  getTickets
);

/** POST /api/v1/tickets/get-filter-options — dependent dropdown values */
router.post(
  "/get-filter-options",
  // authenticateJwt,
  validate(getFilterOptionsSchema, "body"),
  getFilterOptions
);

/** POST /api/v1/tickets/get-service-request-form */
router.post("/get-service-request-form", authenticateJwt, validate(getTicketDetailsSchema), getServiceRequestFormDetails);

/** POST /api/v1/tickets/get-details */
router.post("/get-details",        authenticateJwt, validate(getTicketDetailsSchema), getTicketDetails);

/** POST /api/v1/tickets/get-task-form */
router.post("/get-task-form",      authenticateJwt, validate(getTicketDetailsSchema), getTaskFormDetails);

/** POST /api/v1/tickets/get-task-details */
router.post("/get-task-details",   authenticateJwt, validate(getTicketDetailsSchema), getTaskDetails);

/** POST /api/v1/tickets/get-submitted-form */
router.post("/get-submitted-form", authenticateJwt, validate(getTicketDetailsSchema), getSubmittedForm);

/** POST /api/v1/tickets/log-view — log who previewed an attachment */
router.post("/log-view",      authenticateJwt, validate(attachmentIdSchema, "body"), logView);

/** POST /api/v1/tickets/log-download — increment attachment download_count */
router.post("/log-download",  authenticateJwt, validate(attachmentIdSchema, "body"), logDownload);

export default router;
