import getPool from "../../config/db.js";

// ---------------------------------------------------------------------------
// WHERE clause builder — pure function, no DB calls
// ---------------------------------------------------------------------------

/**
 * Builds a parameterized WHERE clause from filter inputs.
 * All user values go into params array — never interpolated into SQL.
 * Only hardcoded column names are interpolated (safe — no user input).
 *
 * @param {object} filters - Cleaned filter values from Joi
 * @returns {{ whereClause: string, params: any[] }}
 */
export const buildWhereClause = (filters = {}) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  // Multi-select: column IN ($1, $2, ...)
  // Column name is hardcoded — safe to interpolate.
  const addMultiSelect = (column, values) => {
    if (values?.length) {
      const placeholders = values.map(() => `$${idx++}`).join(", ");
      conditions.push(`${column} IN (${placeholders})`);
      params.push(...values);
    }
  };

  // Date range: column >= $n AND column <= $m
  const addDateRange = (column, from, to) => {
    if (from) { conditions.push(`${column} >= $${idx++}`); params.push(from); }
    if (to)   { conditions.push(`${column} <= $${idx++}`); params.push(to); }
  };

  // Free text: case-insensitive partial match
  const addTextSearch = (column, value) => {
    if (value) {
      conditions.push(`${column} ILIKE $${idx++}`);
      params.push(`%${value}%`);
    }
  };

  // Multi-select filters
  addMultiSelect("employee",      filters.employee);
  addMultiSelect("requestor",     filters.requestor);
  addMultiSelect("from_email",    filters.fromEmail);
  addMultiSelect("email_sent_to", filters.emailSentTo);
  addMultiSelect("queue",         filters.queue);
  addMultiSelect("priority",      filters.priority);
  addMultiSelect("status",        filters.status);
  addMultiSelect("resolution",    filters.resolution);

  // Date ranges
  addDateRange("resolved_date", filters.resolvedDateFrom, filters.resolvedDateTo);
  addDateRange("due_date",      filters.dueDateFrom,      filters.dueDateTo);
  addDateRange("closed_date",   filters.closedDateFrom,   filters.closedDateTo);
  addDateRange("open_date",     filters.openDateFrom,     filters.openDateTo);

  // Free text
  addTextSearch("short_description", filters.shortDescription);
  addTextSearch("description",       filters.description);

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, params };
};

// ---------------------------------------------------------------------------
// Raw DB queries — no business logic
// ---------------------------------------------------------------------------

/**
 * Queries paginated ticket rows.
 *
 * @param {string} whereClause
 * @param {any[]}  params       - filter params
 * @param {number} pageSize
 * @param {number} offset
 * @returns {Promise<pg.QueryResult>}
 */
export const queryTickets = (whereClause, params, pageSize, offset) => {
  const pool = getPool();
  const p = params.length;

  const sql = `
    SELECT *
    FROM tickets
    ${whereClause}
    LIMIT $${p + 1} OFFSET $${p + 2}
  `;

  return pool.query(sql, [...params, pageSize, offset]);
};

/**
 * Counts total tickets matching WHERE clause.
 *
 * @param {string} whereClause
 * @param {any[]}  params
 * @returns {Promise<pg.QueryResult>}
 */
export const countTickets = (whereClause, params) => {
  const pool = getPool();

  const sql = `
    SELECT COUNT(*) AS total
    FROM tickets
    ${whereClause}
  `;

  return pool.query(sql, params);
};

/**
 * Fetches DISTINCT values for a single column within WHERE scope.
 * Column name is hardcoded by caller — never user input.
 *
 * @param {string} col          - Hardcoded column name (safe to interpolate)
 * @param {string} whereClause
 * @param {any[]}  params
 * @returns {Promise<pg.QueryResult>}
 */
export const queryDistinct = (col, whereClause, params) => {
  const pool = getPool();

  return pool.query(
    `SELECT DISTINCT ${col} AS value FROM tickets ${whereClause} ORDER BY ${col}`,
    params
  );
};
