import { fetchTickets, fetchTicketDetails } from "./ticket.service.js";
import { MESSAGES } from "../../constants/message.constants.js";
import asyncWrapper from "../../utils/asyncWrapper.js";

/**
 * POST /api/v1/tickets/get-data
 *
 * Body (defaults applied by Joi):
 *   page, pageSize — pagination
 */
export const getTickets = asyncWrapper(async (req, res) => {
  const { page, pageSize } = req.body;

  const result = await fetchTickets({ page, pageSize });

  return res.sendResponse(MESSAGES.ticketsFetched, result);
});

/**
 * POST /api/v1/tickets/get-details
 * Body: { ticketId: string }
 */
export const getTicketDetails = asyncWrapper(async (req, res) => {
  const { ticketId } = req.body;
  const ticket = await fetchTicketDetails({ ticketId });

  if (!ticket) return res.sendResponse(MESSAGES.notFound);

  return res.sendResponse(MESSAGES.ticketDetailsFetched, ticket);
});
