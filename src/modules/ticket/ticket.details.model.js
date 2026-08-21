import getPool from "../../config/db.js";

/**
 * Fetches action history for a ticket.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} ticketId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryActionHistory = (ticketId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.action_history_table
    WHERE ticket_id = $1
    ORDER BY created_at DESC
  `;

  return pool.query(sql, [ticketId]);
};

/**
 * Fetches notes and attachments for a ticket.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} ticketId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryNotesAndAttachments = (ticketId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.notes_attachments_table
    WHERE ticket_id = $1
    ORDER BY last_modified DESC
  `;

  return pool.query(sql, [ticketId]);
};

/**
 * Fetches approval history for a ticket.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} ticketId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryApprovalHistory = (ticketId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.approval_history_table
    WHERE ticket_id = $1
    ORDER BY step_approved_date DESC
  `;

  return pool.query(sql, [ticketId]);
};

/**
 * Fetches incident history for a ticket.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} ticketId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryIncidentHistory = (ticketId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.incident_history_table
    WHERE ticket_id = $1
    ORDER BY date DESC
  `;

  return pool.query(sql, [ticketId]);
};

/**
 * Fetches linked tasks for a ticket.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} ticketId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryLinkedTasks = (ticketId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.linked_tasks_table
    WHERE ticket_id = $1
    ORDER BY due_date ASC
  `;

  return pool.query(sql, [ticketId]);
};

/**
 * Fetches linked incidents for a ticket.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} ticketId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryLinkedIncidents = (ticketId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.linked_incidents_table
    WHERE ticket_id = $1
  `;

  return pool.query(sql, [ticketId]);
};
