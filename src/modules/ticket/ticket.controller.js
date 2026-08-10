import { fetchTickets, fetchFilterOptions } from "./ticket.service.js";
import { MESSAGES } from "../../constants/message.constants.js";
import asyncWrapper from "../../utils/asyncWrapper.js";

/**
 * POST /api/v1/tickets/get-data
 *
 * Body (all optional, defaults applied by Joi):
 *   page, pageSize                          — pagination
 *   employee[], requestor[], fromEmail[],
 *   emailSentTo[], queue[], priority[],
 *   status[], resolution[]                  — multi-select dropdowns
 *   resolvedDateFrom/To, dueDateFrom/To,
 *   closedDateFrom/To, openDateFrom/To      — date ranges (ISO 8601)
 *   shortDescription, description           — free text search
 */
export const getTickets = asyncWrapper(async (req, res) => {
  const { page, pageSize, ...filters } = req.body;

  const result = await fetchTickets({ page, pageSize, filters });

  return res.sendResponse(MESSAGES.ticketsFetched, result);
});

/**
 * POST /api/v1/tickets/filter-options
 *
 * Returns available options for each dropdown, constrained by
 * currently selected filters. Call this on every filter change
 * to keep dropdowns in sync (dependent/cascading filter pattern).
 *
 * Accepts same body fields as get-data (minus pagination).
 */
export const getFilterOptions = asyncWrapper(async (req, res) => {
  const options = await fetchFilterOptions(req.body);

  return res.sendResponse(MESSAGES.filterOptionsFetched, options);
});
