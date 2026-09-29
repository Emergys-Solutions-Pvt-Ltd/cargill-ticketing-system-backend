import { fetchTickets2 } from "./ticket2.service.js";
import { MESSAGES } from "../../constants/message.constants.js";
import asyncWrapper from "../../utils/asyncWrapper.js";
import { getAllowedQueuesModel } from "../rbac/rbac.model.js";

/**
 * POST /api/v1/tickets/get-data-v2
 *
 * Same as get-data but supports multi-level sorting via the `sort` field.
 *
 * Body (all filter fields from get-data, plus):
 *   sort: [
 *     { "col": "ticketStatus",   "dir": "asc"  },
 *     { "col": "ticketOpenDate", "dir": "desc" }
 *   ]
 */
export const getTickets2 = asyncWrapper(async (req, res) => {
  const { page, pageSize, sort, userId, roleCode, ...filters } = req.body;

  // Inject allowed queues if not explicitly provided by UI
  filters.queue = await getAllowedQueuesModel(userId, roleCode, filters.queue);

  if (filters.queue.length === 0) {
    return res.sendResponse(MESSAGES.ticketsFetched || "No queues assigned", {
      tickets: [],
      pagination: { total: 0, page, pageSize, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    });
  }

  const result = await fetchTickets2({ page, pageSize, sort, ...filters });
  return res.sendResponse(MESSAGES.ticketsFetched, result);
});
