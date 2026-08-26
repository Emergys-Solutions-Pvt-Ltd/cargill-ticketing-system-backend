import getPool from "../../config/db.js";

// ---------------------------------------------------------------------------
// WHERE clause builder helpers
// ---------------------------------------------------------------------------

/**
 * Determines which table(s) to query based on filters.
 * @returns {"INCIDENT_ONLY"|"TASK_ONLY"|"UNION"}
 */
export const resolveTableMode = (filters = {}) => {
  const { ticketType, employee, requestor, resolveDateFrom, resolveDateTo } = filters;

  if (ticketType === "TASK") return "TASK_ONLY";
  if (ticketType === "SERVICE_REQUEST" || ticketType === "INCIDENT") return "INCIDENT_ONLY";

  // These fields only exist in incident table — force incident only
  if (employee?.length || requestor?.length || resolveDateFrom || resolveDateTo) {
    return "INCIDENT_ONLY";
  }

  return "UNION";
};

/**
 * Builds parameterized WHERE clause for the incident table.
 * Multi-select = IN (...) = OR between values.
 *
 * @param {object} filters
 * @returns {{ whereClause: string, params: any[] }}
 */
export const buildIncidentWhereClause = (filters = {}) => {
  const conditions = ["bmcservicedesk__incidenttype__c IS NOT NULL"];
  const params = [];
  let idx = 1;

  // Ticket type narrows to sub-type within incident table
  if (filters.ticketType === "SERVICE_REQUEST") {
    conditions.push(`bmcservicedesk__incidenttype__c = $${idx++}`);
    params.push("Service Request");
  } else if (filters.ticketType === "INCIDENT") {
    conditions.push(`bmcservicedesk__incidenttype__c = $${idx++}`);
    params.push("Incident");
  }

  // --- Dropdown multi-select filters (IN = OR) ---
  if (filters.queue?.length) {
    const ph = filters.queue.map(() => `$${idx++}`).join(", ");
    conditions.push(`bmcservicedesk__queue__c IN (${ph})`);
    params.push(...filters.queue);
  }

  if (filters.priority?.length) {
    const ph = filters.priority.map(() => `$${idx++}`).join(", ");
    conditions.push(`bmcservicedesk__fkpriority__c IN (${ph})`);
    params.push(...filters.priority);
  }

  if (filters.status?.length) {
    const ph = filters.status.map(() => `$${idx++}`).join(", ");
    conditions.push(`bmcservicedesk__fkstatus__c IN (${ph})`);
    params.push(...filters.status);
  }

  if (filters.employee?.length) {
    const ph = filters.employee.map(() => `$${idx++}`).join(", ");
    conditions.push(`employeename__c IN (${ph})`);
    params.push(...filters.employee);
  }

  if (filters.requestor?.length) {
    const ph = filters.requestor.map(() => `$${idx++}`).join(", ");
    conditions.push(`requestor_contact__c IN (${ph})`);
    params.push(...filters.requestor);
  }

  // --- Free text filters (ILIKE) ---
  if (filters.shortDescription) {
    conditions.push(`bmcservicedesk__shortdescription__c ILIKE $${idx++}`);
    params.push(`%${filters.shortDescription}%`);
  }

  if (filters.description) {
    conditions.push(`bmcservicedesk__incidentdescription__c ILIKE $${idx++}`);
    params.push(`%${filters.description}%`);
  }

  if (filters.resolution) {
    conditions.push(`bmcservicedesk__incidentresolution__c ILIKE $${idx++}`);
    params.push(`%${filters.resolution}%`);
  }

  // --- Date ranges ---
  if (filters.openDateFrom) { conditions.push(`bmcservicedesk__opendatetime__c >= $${idx++}`); params.push(filters.openDateFrom); }
  if (filters.openDateTo)   { conditions.push(`bmcservicedesk__opendatetime__c <= $${idx++}`); params.push(filters.openDateTo); }

  if (filters.dueDateFrom)  { conditions.push(`bmcservicedesk__duedatetime__c >= $${idx++}`); params.push(filters.dueDateFrom); }
  if (filters.dueDateTo)    { conditions.push(`bmcservicedesk__duedatetime__c <= $${idx++}`); params.push(filters.dueDateTo); }

  if (filters.resolveDateFrom) { conditions.push(`resolved_date__c >= $${idx++}`); params.push(filters.resolveDateFrom); }
  if (filters.resolveDateTo)   { conditions.push(`resolved_date__c <= $${idx++}`); params.push(filters.resolveDateTo); }

  if (filters.closedDateFrom) { conditions.push(`bmcservicedesk__closedatetime__c >= $${idx++}`); params.push(filters.closedDateFrom); }
  if (filters.closedDateTo)   { conditions.push(`bmcservicedesk__closedatetime__c <= $${idx++}`); params.push(filters.closedDateTo); }

  return { whereClause: `WHERE ${conditions.join(" AND ")}`, params };
};

/**
 * Builds parameterized WHERE clause for the task table.
 * Skips: employee, requestor, resolveDateFrom/To (columns don't exist in task).
 *
 * @param {object} filters
 * @returns {{ whereClause: string, params: any[] }}
 */
export const buildTaskWhereClause = (filters = {}) => {
  const conditions = ["bmcservicedesk__incidenttype__c IS NOT NULL"];
  const params = [];
  let idx = 1;

  // Multi-select
  if (filters.queue?.length) {
    const ph = filters.queue.map(() => `$${idx++}`).join(", ");
    conditions.push(`bmcservicedesk__queue__c IN (${ph})`);
    params.push(...filters.queue);
  }

  if (filters.priority?.length) {
    const ph = filters.priority.map(() => `$${idx++}`).join(", ");
    conditions.push(`bmcservicedesk__fkpriority__c IN (${ph})`);
    params.push(...filters.priority);
  }

  if (filters.status?.length) {
    const ph = filters.status.map(() => `$${idx++}`).join(", ");
    conditions.push(`bmcservicedesk__fkstatus__c IN (${ph})`);
    params.push(...filters.status);
  }

  // Free text
  if (filters.shortDescription) {
    conditions.push(`bmcservicedesk__shortdescription__c ILIKE $${idx++}`);
    params.push(`%${filters.shortDescription}%`);
  }

  if (filters.description) {
    conditions.push(`bmcservicedesk__taskdescription__c ILIKE $${idx++}`);
    params.push(`%${filters.description}%`);
  }

  if (filters.resolution) {
    conditions.push(`bmcservicedesk__taskresolution__c ILIKE $${idx++}`);
    params.push(`%${filters.resolution}%`);
  }

  // Date ranges (task has openDateTime, dueDateTime, closeDateTime — NOT resolveDate)
  if (filters.openDateFrom) { conditions.push(`bmcservicedesk__opendatetime__c >= $${idx++}`); params.push(filters.openDateFrom); }
  if (filters.openDateTo)   { conditions.push(`bmcservicedesk__opendatetime__c <= $${idx++}`); params.push(filters.openDateTo); }

  if (filters.dueDateFrom)  { conditions.push(`bmcservicedesk__duedatetime__c >= $${idx++}`); params.push(filters.dueDateFrom); }
  if (filters.dueDateTo)    { conditions.push(`bmcservicedesk__duedatetime__c <= $${idx++}`); params.push(filters.dueDateTo); }

  if (filters.closedDateFrom) { conditions.push(`bmcservicedesk__closedatetime__c >= $${idx++}`); params.push(filters.closedDateFrom); }
  if (filters.closedDateTo)   { conditions.push(`bmcservicedesk__closedatetime__c <= $${idx++}`); params.push(filters.closedDateTo); }

  return { whereClause: `WHERE ${conditions.join(" AND ")}`, params };
};

// ---------------------------------------------------------------------------
// SELECT column definitions (same aliases for UNION compatibility)
// ---------------------------------------------------------------------------

const INCIDENT_COLS = `
  name                                     AS "ticketId",
  bmcrf_shortdescription_c                 AS "ticketShortDesc",
  bmcservicedesk__incidentdescription__c   AS "ticketDescription",
  bmcservicedesk__incidenttype__c          AS "ticketType",
  bmcservicedesk__fkstatus__c              AS "ticketStatus",
  bmcservicedesk__queue__c                 AS "queue",
  bmcservicedesk__fkpriority__c            AS "priority",
  employeename__c                          AS "employee",
  requestor_contact__c                     AS "requestor",
  bmcrf_staff_firstname_c                  AS "staffName",
  request_definition_formula_c             AS "ticketFormName",
  bmcservicedesk__opendatetime__c          AS "ticketOpenDate",
  'INCIDENT'                               AS "source"
`;

const TASK_COLS = `
  name                                     AS "ticketId",
  bmcrf_shortdescription_c                 AS "ticketShortDesc",
  bmcservicedesk__taskdescription__c       AS "ticketDescription",
  bmcservicedesk__incidenttype__c          AS "ticketType",
  bmcservicedesk__fkstatus__c             AS "ticketStatus",
  bmcservicedesk__queue__c                 AS "queue",
  bmcservicedesk__fkpriority__c            AS "priority",
  NULL                                     AS "employee",
  NULL                                     AS "requestor",
  bmcrf_staff_firstname_c                  AS "staffName",
  request_definition_formula_c             AS "ticketFormName",
  bmcservicedesk__opendatetime__c          AS "ticketOpenDate",
  'TASK'                                   AS "source"
`;

// ---------------------------------------------------------------------------
// Paginated ticket queries
// ---------------------------------------------------------------------------

export const queryIncidentTickets = (whereClause, params, pageSize, offset) => {
  const pool = getPool();
  const p = params.length;
  return pool.query(
    `SELECT ${INCIDENT_COLS} FROM gold1.bmcservicedesk__incident_c ${whereClause}
     ORDER BY bmcservicedesk__opendatetime__c DESC
     LIMIT $${p + 1} OFFSET $${p + 2}`,
    [...params, pageSize, offset]
  );
};

export const queryTaskTickets = (whereClause, params, pageSize, offset) => {
  const pool = getPool();
  const p = params.length;
  return pool.query(
    `SELECT ${TASK_COLS} FROM gold1.bmcservicedesk_task_c ${whereClause}
     ORDER BY bmcservicedesk__opendatetime__c DESC
     LIMIT $${p + 1} OFFSET $${p + 2}`,
    [...params, pageSize, offset]
  );
};

/**
 * UNION ALL both tables — params for incident and task are separate arrays.
 * Both WHERE clauses are built independently then combined.
 */
export const queryUnionTickets = (incWhere, incParams, taskWhere, taskParams, pageSize, offset) => {
  const pool = getPool();
  const iLen = incParams.length;
  const tLen = taskParams.length;

  // Task params re-indexed after incident params
  const taskWhereReindexed = taskWhere.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + iLen}`);

  const sql = `
    SELECT * FROM (
      SELECT ${INCIDENT_COLS} FROM gold1.bmcservicedesk__incident_c ${incWhere}
      UNION ALL
      SELECT ${TASK_COLS} FROM gold1.bmcservicedesk_task_c ${taskWhereReindexed}
    ) combined
    ORDER BY "ticketOpenDate" DESC
    LIMIT $${iLen + tLen + 1} OFFSET $${iLen + tLen + 2}
  `;

  return pool.query(sql, [...incParams, ...taskParams, pageSize, offset]);
};

// ---------------------------------------------------------------------------
// Count queries
// ---------------------------------------------------------------------------

export const countIncidentTickets = (whereClause, params) => {
  const pool = getPool();
  return pool.query(
    `SELECT COUNT(*) AS total FROM gold1.bmcservicedesk__incident_c ${whereClause}`,
    params
  );
};

export const countTaskTickets = (whereClause, params) => {
  const pool = getPool();
  return pool.query(
    `SELECT COUNT(*) AS total FROM gold1.bmcservicedesk_task_c ${whereClause}`,
    params
  );
};

export const countUnionTickets = (incWhere, incParams, taskWhere, taskParams) => {
  const pool = getPool();
  const iLen = incParams.length;
  const taskWhereReindexed = taskWhere.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + iLen}`);

  const sql = `
    SELECT COUNT(*) AS total FROM (
      SELECT name FROM gold1.bmcservicedesk__incident_c ${incWhere}
      UNION ALL
      SELECT name FROM gold1.bmcservicedesk_task_c ${taskWhereReindexed}
    ) combined
  `;

  return pool.query(sql, [...incParams, ...taskParams]);
};

// ---------------------------------------------------------------------------
// Filter option queries — DISTINCT values scoped to current filters
// ---------------------------------------------------------------------------

/**
 * Returns DISTINCT non-null values for a column from incident table,
 * constrained by current where clause.
 */
export const queryIncidentDistinct = (col, whereClause, params) => {
  const pool = getPool();
  return pool.query(
    `SELECT DISTINCT ${col} AS value
     FROM gold1.bmcservicedesk__incident_c
     ${whereClause}
     AND ${col} IS NOT NULL
     ORDER BY ${col}`,
    params
  );
};

/**
 * Returns DISTINCT non-null values for a column from task table.
 */
export const queryTaskDistinct = (col, whereClause, params) => {
  const pool = getPool();
  return pool.query(
    `SELECT DISTINCT ${col} AS value
     FROM gold1.bmcservicedesk_task_c
     ${whereClause}
     AND ${col} IS NOT NULL
     ORDER BY ${col}`,
    params
  );
};

/**
 * Returns DISTINCT non-null values UNION'd from both tables.
 */
export const queryUnionDistinct = (col, incWhere, incParams, taskWhere, taskParams) => {
  const pool = getPool();
  const iLen = incParams.length;
  const taskWhereReindexed = taskWhere.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + iLen}`);

  const sql = `
    SELECT DISTINCT value FROM (
      SELECT ${col} AS value FROM gold1.bmcservicedesk__incident_c ${incWhere} AND ${col} IS NOT NULL
      UNION ALL
      SELECT ${col} AS value FROM gold1.bmcservicedesk_task_c ${taskWhereReindexed} AND ${col} IS NOT NULL
    ) combined
    WHERE value IS NOT NULL
    ORDER BY value
  `;

  return pool.query(sql, [...incParams, ...taskParams]);
};

// ---------------------------------------------------------------------------
// Existing detail queries (unchanged)
// ---------------------------------------------------------------------------

export const queryServiceRequestFormDetails = (ticketId) => {
  const pool = getPool();
  return pool.query(`
    SELECT
      "contact_formula__c"                      AS "contact",
      "EmployeeName__c"                         AS "employee",
      "Requestor_Contact__c"                    AS "requestor",
      "Self_Service_Requestor__c"               AS "selfServiceRequestor",
      "From_Email_Address__c"                   AS "fromEmailAddress",
      "template_name_formula__c"                AS "template",
      "request_definition_formula__c"           AS "requestDefinition",
      "HR_Category_Level_1__c"                  AS "categoryLevel1",
      "HR_Category_Level_2__c"                  AS "categoryLevel2",
      "HR_Category_Level_3__c"                  AS "categoryLevel3",
      "Category_More_Info__c"                   AS "categoryMoreInfo",
      "BMCFR__Short_Description__c"             AS "shortDescription",
      "BMCRE__CBS_Reopen_Reason__c"             AS "reopenReason",
      "BMCServiceDesk__incidentDescription__c"  AS "description",
      "BMCServiceDesk__incidentResolution__c"   AS "resolution",
      "BMCServiceDesk__TotalWorkTime__c"        AS "totalWorkTimeMinutes",
      "Transaction_Count__c"                    AS "transactionCount",
      "Email_Sent_To__c"                        AS "emailSentTo",
      "BMCServiceDesk__IncidentType__c"         AS "incidentType",
      "BMCServiceDesk__AlltaskCloseController__c" AS "allTasksClosedController",
      "BMCServiceDesk__contactType__c"          AS "incidentSource",
      "BMCServiceDesk__followUp__c"             AS "followUp",
      "BMCRF__Escalated_Issue__c"               AS "escalatedIssue",
      "BMCServiceDesk__Impact_Id__c"            AS "impact",
      "BMCServiceDesk__Urgency_ID__c"           AS "urgency",
      "BMCServiceDesk__Priority_ID__c"          AS "priority",
      "BMCServiceDesk__Status_ID__c"            AS "status",
      "BMCServiceDesk__firstCallResolution__c"  AS "firstCallResolution",
      "BMCServiceDesk__ClosureCategory__c"      AS "closureCategory",
      "Resolved_Date__c"                        AS "resolvedDate",
      "BMCServiceDesk__dueDateTime__c"          AS "dueDate",
      "BMCServiceDesk__closeDateTime__c"        AS "closedDate",
      "BMCServiceDesk__respondedDateTime__c"    AS "respondedDate",
      "BMCServiceDesk__Queue__c"                AS "queue",
      "Staff_Email__c"                          AS "staff"
    FROM gold1."BMCServiceDesk__Incident__c"
    WHERE "Name" = $1
    LIMIT 1
  `, [ticketId]);
};

export const queryTaskFormDetails = (taskId) => {
  const pool = getPool();
  return pool.query(`
    SELECT
      "contact_formula__c"                      AS "contact",
      "EmployeeName__c"                         AS "employee",
      "Requestor_Contact__c"                    AS "requestor",
      "Self_Service_Requestor__c"               AS "selfServiceRequestor",
      "From_Email_Address__c"                   AS "fromEmailAddress",
      "template_name_formula__c"                AS "template",
      "request_definition_formula__c"           AS "requestDefinition",
      "HR_Category_Level_1__c"                  AS "categoryLevel1",
      "HR_Category_Level_2__c"                  AS "categoryLevel2",
      "HR_Category_Level_3__c"                  AS "categoryLevel3",
      "Category_More_Info__c"                   AS "categoryMoreInfo",
      "BMCFR__Short_Description__c"             AS "shortDescription",
      "BMCRE__CBS_Reopen_Reason__c"             AS "reopenReason",
      "BMCServiceDesk__incidentDescription__c"  AS "description",
      "BMCServiceDesk__incidentResolution__c"   AS "resolution",
      "BMCServiceDesk__TotalWorkTime__c"        AS "totalWorkTimeMinutes",
      "Transaction_Count__c"                    AS "transactionCount",
      "Email_Sent_To__c"                        AS "emailSentTo",
      "BMCServiceDesk__IncidentType__c"         AS "incidentType",
      "BMCServiceDesk__AlltaskCloseController__c" AS "allTasksClosedController",
      "BMCServiceDesk__contactType__c"          AS "incidentSource",
      "BMCServiceDesk__followUp__c"             AS "followUp",
      "BMCRF__Escalated_Issue__c"               AS "escalatedIssue",
      "BMCServiceDesk__Impact_Id__c"            AS "impact",
      "BMCServiceDesk__Urgency_ID__c"           AS "urgency",
      "BMCServiceDesk__Priority_ID__c"          AS "priority",
      "BMCServiceDesk__Status_ID__c"            AS "status",
      "BMCServiceDesk__firstCallResolution__c"  AS "firstCallResolution",
      "BMCServiceDesk__ClosureCategory__c"      AS "closureCategory",
      "Resolved_Date__c"                        AS "resolvedDate",
      "BMCServiceDesk__dueDateTime__c"          AS "dueDate",
      "BMCServiceDesk__closeDateTime__c"        AS "closedDate",
      "BMCServiceDesk__respondedDateTime__c"    AS "respondedDate",
      "BMCServiceDesk__Queue__c"                AS "queue",
      "Staff_Email__c"                          AS "staff"
    FROM gold1.bmcservicedesk_task_c
    WHERE "Name" = $1
    LIMIT 1
  `, [taskId]);
};

export const querySubmittedForm = (ticketId) => {
  const pool = getPool();
  return pool.query(`
    SELECT
      bmcservicedesk__input__c    AS "input",
      bmcservicedesk__response__c AS "response"
    FROM gold1.bmcservicedesk__srm_requestdetailinputs__c bsrc
    WHERE bmcservicedesk__fkrequestdetail__c = (
      SELECT id
      FROM gold1.bmcservicedesk__srm_requestdetail__c bsrc2
      WHERE bsrc2.bmcservicedesk__fkincident__c = $1
    )
    ORDER BY bsrc.lastmodifieddate
  `, [ticketId]);
};
