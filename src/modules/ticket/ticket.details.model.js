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
 * Fetches attachments for a ticket.
 * Returns all columns (incl. download_count) + preview_list from view logs.
 *
 * @param {string} ticketId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryNotesAndAttachments = (ticketId) => {
  const pool = getPool();

  const sql = `
    SELECT
      a.*,
      COALESCE(vl.preview_list, '[]'::json) AS preview_list
    FROM gold1.attachment a
    LEFT JOIN (
      SELECT
        attachment_id,
        json_agg(
          json_build_object('user_id', user_id, 'viewed_at', viewed_at)
          ORDER BY viewed_at DESC
        ) AS preview_list
      FROM gold1.attachment_view_logs
      GROUP BY attachment_id
    ) vl ON vl.attachment_id = a.id
    WHERE a.ticket_id = $1
    ORDER BY a.last_modified DESC
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

// ---------------------------------------------------------------------------
// Task detail queries — same structure, different WHERE param (taskId)
// ---------------------------------------------------------------------------

/**
 * Fetches action history for a task.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} taskId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryTaskActionHistory = (taskId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.action_history_table
    WHERE ticket_id = $1
    ORDER BY created_at DESC
  `;

  return pool.query(sql, [taskId]);
};

/**
 * Fetches attachments for a task.
 * Returns all columns (incl. download_count) + preview_list from view logs.
 *
 * @param {string} taskId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryTaskNotesAndAttachments = (taskId) => {
  const pool = getPool();

  const sql = `
    SELECT
      a.*,
      COALESCE(vl.preview_list, '[]'::json) AS preview_list
    FROM gold1.attachment a
    LEFT JOIN (
      SELECT
        attachment_id,
        json_agg(
          json_build_object('user_id', user_id, 'viewed_at', viewed_at)
          ORDER BY viewed_at DESC
        ) AS preview_list
      FROM gold1.attachment_view_logs
      GROUP BY attachment_id
    ) vl ON vl.attachment_id = a.id
    WHERE a.ticket_id = $1
    ORDER BY a.last_modified DESC
  `;

  return pool.query(sql, [taskId]);
};

/**
 * Fetches approval history for a task.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} taskId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryTaskApprovalHistory = (taskId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.approval_history_table
    WHERE ticket_id = $1
    ORDER BY step_approved_date DESC
  `;

  return pool.query(sql, [taskId]);
};

/**
 * Fetches incident history for a task.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} taskId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryTaskIncidentHistory = (taskId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.incident_history_table
    WHERE ticket_id = $1
    ORDER BY date DESC
  `;

  return pool.query(sql, [taskId]);
};

/**
 * Fetches linked tasks for a task.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} taskId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryTaskLinkedTasks = (taskId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.linked_tasks_table
    WHERE ticket_id = $1
    ORDER BY due_date ASC
  `;

  return pool.query(sql, [taskId]);
};

/**
 * Fetches linked incidents for a task.
 * TODO: Replace placeholder query with actual table/column names.
 *
 * @param {string} taskId
 * @returns {Promise<pg.QueryResult>}
 */
export const queryTaskLinkedIncidents = (taskId) => {
  const pool = getPool();

  const sql = `
    SELECT *
    FROM gold1.linked_incidents_table
    WHERE ticket_id = $1
  `;

  return pool.query(sql, [taskId]);
};

// ---------------------------------------------------------------------------
// Attachment audit queries
// ---------------------------------------------------------------------------

/**
 * Insert a preview (view) log for an attachment.
 * user_id comes from JWT (req.user.sub or similar).
 *
 * @param {string} attachmentId
 * @param {string} userId
 * @returns {Promise<pg.QueryResult>}
 */
export const insertAttachmentViewLog = (attachmentId, userId) => {
  const pool = getPool();

  const sql = `
    INSERT INTO gold1.attachment_view_logs (attachment_id, user_id, viewed_at)
    VALUES ($1, $2, NOW())
    RETURNING id, attachment_id, user_id, viewed_at
  `;

  return pool.query(sql, [attachmentId, userId]);
};

/**
 * Increment download_count by 1 on the attachment row.
 *
 * @param {string} attachmentId
 * @returns {Promise<pg.QueryResult>}
 */
export const incrementAttachmentDownloadCount = (attachmentId) => {
  const pool = getPool();

  const sql = `
    UPDATE gold1.attachment
    SET download_count = download_count + 1
    WHERE id = $1
    RETURNING id, download_count
  `;

  return pool.query(sql, [attachmentId]);
};

