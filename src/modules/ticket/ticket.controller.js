import { fetchTickets } from "./ticket.service.js";
import { MESSAGES } from "../../constants/message.constants.js";
import asyncWrapper from "../../utils/asyncWrapper.js";

/**
 * GET /api/v1/tickets/get-data
 *
 * Query params (all optional, defaults applied by Joi):
 *   page       {number}  - Page number, default 1
 *   pageSize   {number}  - Rows per page, default 10, max 100
 */
export const getTickets = asyncWrapper(async (req, res) => {
  const { page, pageSize } = req.query;

  const result = await fetchTickets({ page, pageSize });

  return res.sendResponse(MESSAGES.ticketsFetched, result);
});
