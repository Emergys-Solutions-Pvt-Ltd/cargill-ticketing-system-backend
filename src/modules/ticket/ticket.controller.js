import {
  fetchTickets,
  fetchServiceRequestFormDetails,
  fetchTicketDetails,
  fetchTaskFormDetails,
  fetchTaskDetails,
  fetchSubmittedForm,
} from "./ticket.service.js";
import { MESSAGES } from "../../constants/message.constants.js";
import asyncWrapper from "../../utils/asyncWrapper.js";

/**
 * POST /api/v1/tickets/get-data
 * Body: { page, pageSize }
 */
export const getTickets = asyncWrapper(async (req, res) => {
  const { page, pageSize } = req.body;
  const result = await fetchTickets({ page, pageSize });
  return res.sendResponse(MESSAGES.ticketsFetched, result);
});

/**
 * POST /api/v1/tickets/get-service-request-form
 * Body: { ticketId: string }
 */
export const getServiceRequestFormDetails = asyncWrapper(async (req, res) => {
  const { ticketId } = req.body;
  const ticket = await fetchServiceRequestFormDetails({ ticketId });
  if (!ticket) return res.sendResponse(MESSAGES.notFound);
  return res.sendResponse(MESSAGES.ticketDetailsFetched, ticket);
});

/**
 * POST /api/v1/tickets/get-details
 * Body: { ticketId: string }
 * Returns all accordion sections for a ticket (incident/service request).
 */
export const getTicketDetails = asyncWrapper(async (req, res) => {
  const { ticketId } = req.body;
  const result = await fetchTicketDetails({ ticketId });
  return res.sendResponse(MESSAGES.ticketDetailsFetched, result);
});

/**
 * POST /api/v1/tickets/get-task-form
 * Body: { ticketId: string }
 * Returns task form details (same shape as service request form).
 */
export const getTaskFormDetails = asyncWrapper(async (req, res) => {
  const { ticketId } = req.body;
  const task = await fetchTaskFormDetails({ taskId: ticketId });
  if (!task) return res.sendResponse(MESSAGES.notFound);
  return res.sendResponse(MESSAGES.ticketDetailsFetched, task);
});

/**
 * POST /api/v1/tickets/get-task-details
 * Body: { ticketId: string }
 * Returns all accordion sections for a task.
 */
export const getTaskDetails = asyncWrapper(async (req, res) => {
  const { ticketId } = req.body;
  const result = await fetchTaskDetails({ taskId: ticketId });
  return res.sendResponse(MESSAGES.ticketDetailsFetched, result);
});

/**
 * POST /api/v1/tickets/get-submitted-form
 * Body: { ticketId: string }
 * Returns dynamically transformed submitted form rows.
 * Rows with response === "header section" become { type: "header", title }.
 * All other rows become { type: "field", label, value }.
 */
export const getSubmittedForm = asyncWrapper(async (req, res) => {
  const { ticketId } = req.body;
  const result = await fetchSubmittedForm({ ticketId });
  return res.sendResponse(MESSAGES.ticketDetailsFetched, result);
});
