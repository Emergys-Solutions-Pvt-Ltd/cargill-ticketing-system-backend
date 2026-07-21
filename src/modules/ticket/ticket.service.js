import getPool from "../../config/db.js";

/**
 * Fetches paginated tickets from the DB.
 *
 * @param {object} params
 * @param {number} params.page      - Current page (1-indexed)
 * @param {number} params.pageSize  - Rows per page
 * @returns {Promise<{ tickets: object[], pagination: object }>}
 */
export const fetchTickets = async ({ page, pageSize }) => {
  const pool = getPool();
  const offset = (page - 1) * pageSize;

  const dataQuery = `
    SELECT *
    FROM tickets
    LIMIT $1 OFFSET $2
  `;

  const countQuery = `SELECT COUNT(*) AS total FROM tickets`;

  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQuery, [pageSize, offset]),
    pool.query(countQuery),
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
