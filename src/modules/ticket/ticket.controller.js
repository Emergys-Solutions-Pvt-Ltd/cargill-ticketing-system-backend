import {
  fetchTickets,
  fetchFilterOptions,
  fetchServiceRequestFormDetails,
  fetchTicketDetails,
  fetchTaskFormDetails,
  fetchTaskDetails,
  fetchSubmittedForm,
  logAttachmentView,
  logAttachmentDownload,
} from "./ticket.service.js";
import { MESSAGES } from "../../constants/message.constants.js";
import asyncWrapper from "../../utils/asyncWrapper.js";
import { getAllowedQueuesModel } from "../rbac/rbac.model.js";

/**
 * POST /api/v1/tickets/get-data
 * Body: { page, pageSize, ticketType, queue[], priority[], status[], ... }
 */
export const getTickets = asyncWrapper(async (req, res) => {
  const { page, pageSize, userId, roleCode, ...filters } = req.body;
   
  // Inject allowed queues if not explicitly provided by UI
  filters.queue = await getAllowedQueuesModel(userId, roleCode, filters.queue);
  
  if (filters.queue.length === 0) {
    return res.sendResponse(MESSAGES.ticketsFetched || "No queues assigned", {
      tickets: [],
      pagination: { total: 0, page, pageSize, totalPages: 0, hasNextPage: false, hasPrevPage: false }
    });
  }
  
  const result = await fetchTickets({ page, pageSize, ...filters });
  return res.sendResponse(MESSAGES.ticketsFetched, result);
});

/**
 * POST /api/v1/tickets/get-filter-options
 * Body: same filter fields as get-data (no page/pageSize)
 * Returns dependent dropdown options scoped to current filter selection.
 */
export const getFilterOptions = asyncWrapper(async (req, res) => {
  const { userId, roleCode, ...filters } = req.body;
  
  // Inject allowed queues if not explicitly provided by UI
  filters.queue = await getAllowedQueuesModel(userId, roleCode, filters.queue);

  if (filters.queue.length === 0) {
    return res.sendResponse(MESSAGES.filterOptionsFetched || "No queues assigned", { 
      queue: [], priority: [], status: [], employee: [], requestor: [], categoryLevel1: [], categoryLevel2: [], categoryLevel3: [] 
    });
  }

  const result = await fetchFilterOptions(filters);
  return res.sendResponse(MESSAGES.filterOptionsFetched, result);
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
 */
export const getTicketDetails = asyncWrapper(async (req, res) => {
  const { ticketId } = req.body;
  const result = await fetchTicketDetails({ ticketId });
  return res.sendResponse(MESSAGES.ticketDetailsFetched, result);
});

/**
 * POST /api/v1/tickets/get-task-form
 * Body: { ticketId: string }
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
 */
export const getTaskDetails = asyncWrapper(async (req, res) => {
  const { ticketId } = req.body;
  const result = await fetchTaskDetails({ taskId: ticketId });
  return res.sendResponse(MESSAGES.ticketDetailsFetched, result);
});

/**
 * POST /api/v1/tickets/get-submitted-form
 * Body: { ticketId: string }
 */
export const getSubmittedForm = asyncWrapper(async (req, res) => {
  const { ticketId } = req.body;
  const result = await fetchSubmittedForm({ ticketId });
  return res.sendResponse(MESSAGES.ticketDetailsFetched, result);
});

/**
 * POST /api/v1/tickets/log-view
 * Body: { attachmentId }
 * Logs who previewed an attachment and when (user from JWT).
 */
export const logView = asyncWrapper(async (req, res) => {
  const { attachmentId } = req.body;
  const userId = req.user?.sub ?? req.user?.username ?? req.user?.email;
  const log = await logAttachmentView({ attachmentId, userId });
  return res.sendResponse(MESSAGES.attachmentViewLogged, log);
});

/**
 * POST /api/v1/tickets/log-download
 * Body: { attachmentId }
 * Increments download_count on the attachment row.
 */
export const logDownload = asyncWrapper(async (req, res) => {
  const { attachmentId } = req.body;
  const result = await logAttachmentDownload({ attachmentId });
  return res.sendResponse(MESSAGES.attachmentDownloadLogged, result);
});

