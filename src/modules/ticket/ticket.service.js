import {
  queryTickets,
  countTickets,
} from "./ticket.model.js";

/**
 * Fetches paginated tickets.
 *
 * @param {object} params
 * @param {number} params.page      - Current page (1-indexed)
 * @param {number} params.pageSize  - Rows per page
 * @returns {Promise<{ tickets: object[], pagination: object }>}
 */
export const fetchTickets = async ({ page, pageSize }) => {
  const offset = (page - 1) * pageSize;

  const [dataResult, countResult] = await Promise.all([
    queryTickets(pageSize, offset),
    countTickets(),
  ]);

  const total = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(total / pageSize);

  return {
    tickets: dataResult.rows,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};