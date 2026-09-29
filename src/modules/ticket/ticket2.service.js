import {
  resolveTableMode,
  buildIncidentWhereClause,
  buildTaskWhereClause,
  queryIncidentTickets2,
  queryTaskTickets2,
  queryUnionTickets2,
  countIncidentTickets,
  countTaskTickets,
  countUnionTickets,
} from "./ticket2.model.js";

// ---------------------------------------------------------------------------
// Ticket list with multi-level sorting
// ---------------------------------------------------------------------------

/**
 * Fetches paginated, filtered, sorted tickets.
 *
 * @param {object} options
 * @param {number} options.page
 * @param {number} options.pageSize
 * @param {Array<{ col: string, dir: "asc"|"desc" }>} options.sort  — multi-level sort
 * @param {object} options...filters                                  — all other filter fields
 * @returns {Promise<{ tickets: object[], pagination: object }>}
 */
export const fetchTickets2 = async ({ page, pageSize, sort = [], ...filters }) => {
  const offset = (page - 1) * pageSize;
  const mode   = resolveTableMode(filters);

  let dataResult, countResult;

  if (mode === "INCIDENT_ONLY") {
    const { whereClause, params } = buildIncidentWhereClause(filters);
    [dataResult, countResult] = await Promise.all([
      queryIncidentTickets2(whereClause, params, pageSize, offset, sort),
      countIncidentTickets(whereClause, params),
    ]);
  } else if (mode === "TASK_ONLY") {
    const { whereClause, params } = buildTaskWhereClause(filters);
    [dataResult, countResult] = await Promise.all([
      queryTaskTickets2(whereClause, params, pageSize, offset, sort),
      countTaskTickets(whereClause, params),
    ]);
  } else {
    // UNION — build both WHERE clauses independently
    const inc  = buildIncidentWhereClause(filters);
    const task = buildTaskWhereClause(filters);
    [dataResult, countResult] = await Promise.all([
      queryUnionTickets2(inc.whereClause, inc.params, task.whereClause, task.params, pageSize, offset, sort),
      countUnionTickets(inc.whereClause, inc.params, task.whereClause, task.params),
    ]);
  }

  const total      = parseInt(countResult.rows[0].total, 10);
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
