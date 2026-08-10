import {
  buildWhereClause,
  queryTickets,
  countTickets,
  queryDistinct,
} from "./ticket.model.js";

// ---------------------------------------------------------------------------
// fetchTickets — orchestrates model calls, computes pagination
// ---------------------------------------------------------------------------

/**
 * Fetches paginated tickets with optional filters applied.
 *
 * @param {object} params
 * @param {number} params.page      - Current page (1-indexed)
 * @param {number} params.pageSize  - Rows per page
 * @param {object} params.filters   - Joi-validated filter values
 * @returns {Promise<{ tickets: object[], pagination: object }>}
 */
export const fetchTickets = async ({ page, pageSize, filters }) => {
  const offset = (page - 1) * pageSize;
  const { whereClause, params } = buildWhereClause(filters);

  const [dataResult, countResult] = await Promise.all([
    queryTickets(whereClause, params, pageSize, offset),
    countTickets(whereClause, params),
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

// ---------------------------------------------------------------------------
// fetchFilterOptions — orchestrates parallel DISTINCT queries
// ---------------------------------------------------------------------------

/**
 * Returns available distinct values per dropdown filter,
 * constrained by current filter selections (dependent filter pattern).
 *
 * @param {object} filters - Same shape as fetchTickets filters
 * @returns {Promise<object>}
 */
export const fetchFilterOptions = async (filters) => {
  const { whereClause, params } = buildWhereClause(filters);

  const distinct = (col) => queryDistinct(col, whereClause, params);

  const [
    employees,
    requestors,
    fromEmails,
    emailsSentTo,
    queues,
    priorities,
    statuses,
    resolutions,
  ] = await Promise.all([
    distinct("employee"),
    distinct("requestor"),
    distinct("from_email"),
    distinct("email_sent_to"),
    distinct("queue"),
    distinct("priority"),
    distinct("status"),
    distinct("resolution"),
  ]);

  const toOptions = (result) =>
    result.rows.map((r) => r.value).filter(Boolean);

  return {
    employee:    toOptions(employees),
    requestor:   toOptions(requestors),
    fromEmail:   toOptions(fromEmails),
    emailSentTo: toOptions(emailsSentTo),
    queue:       toOptions(queues),
    priority:    toOptions(priorities),
    status:      toOptions(statuses),
    resolution:  toOptions(resolutions),
  };
};