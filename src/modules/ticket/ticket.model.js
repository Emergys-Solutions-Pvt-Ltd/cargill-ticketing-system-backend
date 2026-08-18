import getPool from "../../config/db.js";

/**
 * Queries paginated ticket rows.
 *
 * @param {number} pageSize
 * @param {number} offset
 * @returns {Promise<pg.QueryResult>}
 */
export const queryTickets = (pageSize, offset) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.test
    LIMIT $1 OFFSET $2
  `;

  return pool.query(sql, [pageSize, offset]);
};

/**
 * Counts total tickets.
 *
 * @returns {Promise<pg.QueryResult>}
 */
export const countTickets = () => {
  const pool = getPool();

  const sql = `
    SELECT COUNT(*) AS total
    FROM gold1.test
  `;

  return pool.query(sql);
};
