import getPool from "../../config/db.js";
import { getConfig } from "../../config/env.config.js";

// ---------------------------------------------------------------------------
// WHERE clause builder helpers
// ---------------------------------------------------------------------------

export const resolveTableMode = (filters = {}) => {
  const { ticketType, employee, requestor, resolveDateFrom, resolveDateTo, categoryLevel1, categoryLevel2, categoryLevel3 } = filters;

  if (ticketType === "TASK") return "TASK_ONLY";
  if (ticketType === "SERVICE_REQUEST" || ticketType === "INCIDENT") return "INCIDENT_ONLY";

  if (employee?.length || requestor?.length || resolveDateFrom || resolveDateTo || categoryLevel1?.length || categoryLevel2?.length || categoryLevel3?.length) {
    return "INCIDENT_ONLY";
  }

  return "UNION";
};

export const buildIncidentWhereClause = (filters = {}) => {
  const conditions = ["1=1"];
  const params = [];
  let idx = 1;

  if (filters.ticketType === "SERVICE_REQUEST") {
    conditions.push(`bmcservicedesk__isservicerequest__c = TRUE`);
  } else if (filters.ticketType === "INCIDENT") {
    conditions.push(`bmcservicedesk__isservicerequest__c = FALSE`);
  }

  if (filters.queue?.length) {
    const ph = filters.queue.map(() => `$${idx++}`).join(", ");
    conditions.push(`BMCServiceDesk__Queue__c IN (${ph})`);
    params.push(...filters.queue);
  }
  if (filters.priority?.length) {
    const ph = filters.priority.map(() => `$${idx++}`).join(", ");
    conditions.push(`BMCServiceDesk__FKPriority__c IN (${ph})`);
    params.push(...filters.priority);
  }
  if (filters.status?.length) {
    const ph = filters.status.map(() => `$${idx++}`).join(", ");
    conditions.push(`bmcservicedesk__status_id__c IN (${ph})`);
    params.push(...filters.status);
  }
  if (filters.employee?.length) {
    const ph = filters.employee.map(() => `$${idx++}`).join(", ");
    conditions.push(`EmployeeName__c IN (${ph})`);
    params.push(...filters.employee);
  }
  if (filters.requestor?.length) {
    const ph = filters.requestor.map(() => `$${idx++}`).join(", ");
    conditions.push(`Requestor_Contact__c IN (${ph})`);
    params.push(...filters.requestor);
  }
  if (filters.categoryLevel1?.length) {
    const ph = filters.categoryLevel1.map(() => `$${idx++}`).join(", ");
    conditions.push(`hr_category_level_1__c IN (${ph})`);
    params.push(...filters.categoryLevel1);
  }
  if (filters.categoryLevel2?.length) {
    const ph = filters.categoryLevel2.map(() => `$${idx++}`).join(", ");
    conditions.push(`hr_category_level_2__c IN (${ph})`);
    params.push(...filters.categoryLevel2);
  }
  if (filters.categoryLevel3?.length) {
    const ph = filters.categoryLevel3.map(() => `$${idx++}`).join(", ");
    conditions.push(`hr_category_level_3__c IN (${ph})`);
    params.push(...filters.categoryLevel3);
  }

  if (filters.shortDescription) { conditions.push(`bmcrf_short_description__c ILIKE $${idx++}`); params.push(`%${filters.shortDescription}%`); }
  if (filters.description)      { conditions.push(`bmcservicedesk__incidentdescription__c ILIKE $${idx++}`); params.push(`%${filters.description}%`); }
  if (filters.resolution)       { conditions.push(`BMCServiceDesk__incidentResolution__c ILIKE $${idx++}`); params.push(`%${filters.resolution}%`); }

  if (filters.openDateFrom)    { conditions.push(`bmcrf_opened_date_formula__c >= $${idx++}`); params.push(filters.openDateFrom); }
  if (filters.openDateTo)      { conditions.push(`bmcrf_opened_date_formula__c <= $${idx++}`); params.push(filters.openDateTo); }
  if (filters.dueDateFrom)     { conditions.push(`BMCRF_Due_Date_Formula__c >= $${idx++}`); params.push(filters.dueDateFrom); }
  if (filters.dueDateTo)       { conditions.push(`BMCRF_Due_Date_Formula__c <= $${idx++}`); params.push(filters.dueDateTo); }
  if (filters.resolveDateFrom) { conditions.push(`Resolved_Date__c >= $${idx++}`); params.push(filters.resolveDateFrom); }
  if (filters.resolveDateTo)   { conditions.push(`Resolved_Date__c <= $${idx++}`); params.push(filters.resolveDateTo); }
  if (filters.closedDateFrom)  { conditions.push(`BMCRF_Closed_Date_Formula__c >= $${idx++}`); params.push(filters.closedDateFrom); }
  if (filters.closedDateTo)    { conditions.push(`BMCRF_Closed_Date_Formula__c <= $${idx++}`); params.push(filters.closedDateTo); }

  if (filters.globalSearch) {
    conditions.push(`
      CONCAT_WS(' ',
        resolved_date__c::text,
        bmcservicedesk__dueDateTime__c::text,
        bmcservicedesk__closeDateTime__c::text,
        EmployeeName__c::text,
        Requestor_contact__c::text,
        from_email_address__c::text,
        email_sent_to__c::text,
        bmcservicedesk__queue__c::text,
        BMCServiceDesk__Priority_ID__c::text,
        BMCServiceDesk__Status_ID__c::text,
        bmcrf_short_description__c::text,
        bmcservicedesk__incidentdescription__c::text,
        bmcservicedesk__incidentresolution__c::text,
        bmcrf_opened_date_formula__c::text
      ) ILIKE $${idx++}
    `);
    params.push(`%${filters.globalSearch}%`);
  }

  return { whereClause: `WHERE ${conditions.join(" AND ")}`, params };
};

export const buildTaskWhereClause = (filters = {}) => {
  const conditions = ["1=1"];
  const params = [];
  let idx = 1;

  if (filters.queue?.length) {
    const ph = filters.queue.map(() => `$${idx++}`).join(", ");
    conditions.push(`BMCServiceDesk__Queue__c IN (${ph})`);
    params.push(...filters.queue);
  }
  if (filters.priority?.length) {
    const ph = filters.priority.map(() => `$${idx++}`).join(", ");
    conditions.push(`BMCServiceDesk__FKPriority__c IN (${ph})`);
    params.push(...filters.priority);
  }
  if (filters.status?.length) {
    const ph = filters.status.map(() => `$${idx++}`).join(", ");
    conditions.push(`bmcservicedesk__status_id__c IN (${ph})`);
    params.push(...filters.status);
  }

  if (filters.shortDescription) { conditions.push(`bmcservicedesk__taskdescription__c ILIKE $${idx++}`); params.push(`%${filters.shortDescription}%`); }
  if (filters.description)      { conditions.push(`bmcservicedesk__taskdescription__c ILIKE $${idx++}`); params.push(`%${filters.description}%`); }
  if (filters.resolution)       { conditions.push(`BMCServiceDesk__taskResolution__c ILIKE $${idx++}`); params.push(`%${filters.resolution}%`); }

  if (filters.openDateFrom)   { conditions.push(`BMCServiceDesk__openDateTime__c >= $${idx++}`); params.push(filters.openDateFrom); }
  if (filters.openDateTo)     { conditions.push(`BMCServiceDesk__openDateTime__c <= $${idx++}`); params.push(filters.openDateTo); }
  if (filters.dueDateFrom)    { conditions.push(`BMCServiceDesk__dueDateTime__c >= $${idx++}`); params.push(filters.dueDateFrom); }
  if (filters.dueDateTo)      { conditions.push(`BMCServiceDesk__dueDateTime__c <= $${idx++}`); params.push(filters.dueDateTo); }
  if (filters.closedDateFrom) { conditions.push(`BMCServiceDesk__closeDateTime__c >= $${idx++}`); params.push(filters.closedDateFrom); }
  if (filters.closedDateTo)   { conditions.push(`BMCServiceDesk__closeDateTime__c <= $${idx++}`); params.push(filters.closedDateTo); }

  if (filters.globalSearch) {
    conditions.push(`
      CONCAT_WS(' ',
        bmcservicedesk__dueDateTime__c::text,
        bmcservicedesk__closeDateTime__c::text,
        bmcservicedesk__queueName__c::text,
        bmcservicedesk__priority_id__c::text,
        bmcservicedesk__status_id__c::text,
        BMCServiceDesk__shortDescription__c::text,
        bmcservicedesk__taskDescription__c::text,
        bmcservicedesk__taskResolution__c::text,
        BMCServiceDesk__openDateTime__c::text
      ) ILIKE $${idx++}
    `);
    params.push(`%${filters.globalSearch}%`);
  }

  return { whereClause: `WHERE ${conditions.join(" AND ")}`, params };
};

const INCIDENT_COLS = `
    id as id,
    bmcrf_short_description__c AS "ticketShortDesc",
    bmcservicedesk__incidentdescription__c AS "ticketDescription",
    CASE 
      WHEN bmcservicedesk__isservicerequest__c = TRUE THEN 'serviceRequest'
      ELSE 'incident'
    END as ticketType,
    bmcservicedesk__status_id__c AS "ticketStatus",
    bmcrf_staff_firstname__c AS "staffName",
    name AS "ticketId",
    BMCServiceDesk__clientId__c as "clientId",
    request_definition_formula__c AS "ticketFormName",
    bmcrf_opened_date_formula__c::timestamp AS "ticketOpenDate"
`;

const TASK_COLS = `
    id as id,
    bmcservicedesk__taskdescription__c AS "ticketShortDesc",
    bmcservicedesk__taskdescription__c AS "ticketDescription",
    'task' AS "ticketType",
    bmcservicedesk__status_id__c AS "ticketStatus",
    staff_formula__c AS "staffName",
    name AS "ticketId",
    BMCServiceDesk__Client_ID__c as "clientId",
    bmcservicedesk__taskdescription__c AS "ticketFormName",
    BMCServiceDesk__openDateTime__c::timestamp AS "ticketOpenDate"
`;

export const queryIncidentTickets = (whereClause, params, pageSize, offset) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  const p = params.length;
  return pool.query(
    `SELECT ${INCIDENT_COLS} FROM ${ticketSchema}.bmcservicedesk__incident__c ${whereClause}
     ORDER BY "ticketOpenDate" DESC
     LIMIT $${p + 1} OFFSET $${p + 2}`,
    [...params, pageSize, offset]
  );
};

export const queryTaskTickets = (whereClause, params, pageSize, offset) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  const p = params.length;
  return pool.query(
    `SELECT ${TASK_COLS} FROM ${ticketSchema}.bmcservicedesk__task__c ${whereClause}
     ORDER BY "ticketOpenDate" DESC
     LIMIT $${p + 1} OFFSET $${p + 2}`,
    [...params, pageSize, offset]
  );
};

export const queryUnionTickets = (incWhere, incParams, taskWhere, taskParams, pageSize, offset) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  const iLen = incParams.length;
  const tLen = taskParams.length;
  const taskWhereReindexed = taskWhere.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + iLen}`);

  const sql = `
    SELECT * FROM (
      SELECT ${INCIDENT_COLS} FROM ${ticketSchema}.bmcservicedesk__incident__c ${incWhere}
      UNION ALL
      SELECT ${TASK_COLS} FROM ${ticketSchema}.bmcservicedesk__task__c ${taskWhereReindexed}
    ) combined
    ORDER BY "ticketOpenDate" DESC
    LIMIT $${iLen + tLen + 1} OFFSET $${iLen + tLen + 2}
  `;

  return pool.query(sql, [...incParams, ...taskParams, pageSize, offset]);
};

export const countIncidentTickets = (whereClause, params) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  return pool.query(`SELECT COUNT(*) AS total FROM ${ticketSchema}.bmcservicedesk__incident__c ${whereClause}`, params);
};

export const countTaskTickets = (whereClause, params) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  return pool.query(`SELECT COUNT(*) AS total FROM ${ticketSchema}.bmcservicedesk__task__c ${whereClause}`, params);
};

export const countUnionTickets = (incWhere, incParams, taskWhere, taskParams) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  const iLen = incParams.length;
  const taskWhereReindexed = taskWhere.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + iLen}`);

  const sql = `
    WITH combined AS (
      SELECT name FROM ${ticketSchema}.bmcservicedesk__incident__c ${incWhere}
      UNION ALL
      SELECT name FROM ${ticketSchema}.bmcservicedesk__task__c ${taskWhereReindexed}
    )
    SELECT COUNT(*) AS total FROM combined
  `;

  return pool.query(sql, [...incParams, ...taskParams]);
};

export const queryIncidentDistinct = (col, whereClause, params) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  return pool.query(
    `SELECT DISTINCT ${col} AS value FROM ${ticketSchema}.bmcservicedesk__incident__c ${whereClause} AND ${col} IS NOT NULL ORDER BY ${col}`,
    params
  );
};

export const queryTaskDistinct = (col, whereClause, params) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  return pool.query(
    `SELECT DISTINCT ${col} AS value FROM ${ticketSchema}.bmcservicedesk__task__c ${whereClause} AND ${col} IS NOT NULL ORDER BY ${col}`,
    params
  );
};

export const queryUnionDistinct = (col, incWhere, incParams, taskWhere, taskParams) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  const iLen = incParams.length;
  const taskWhereReindexed = taskWhere.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + iLen}`);

  const sql = `
    SELECT DISTINCT value FROM (
      SELECT ${col} AS value FROM ${ticketSchema}.bmcservicedesk__incident__c ${incWhere} AND ${col} IS NOT NULL
      UNION ALL
      SELECT ${col} AS value FROM ${ticketSchema}.bmcservicedesk__task__c ${taskWhereReindexed} AND ${col} IS NOT NULL
    ) combined
    WHERE value IS NOT NULL
    ORDER BY value
  `;

  return pool.query(sql, [...incParams, ...taskParams]);
};

// ---------------------------------------------------------------------------
// Existing detail queries
// ---------------------------------------------------------------------------

export const queryServiceRequestFormDetails = (ticketId) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
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
    FROM ${ticketSchema}."BMCServiceDesk__Incident__c"
    WHERE "Name" = $1
    LIMIT 1
  `, [ticketId]);
};

export const queryTaskFormDetails = (taskId) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
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
    FROM ${ticketSchema}.bmcservicedesk__task__c
    WHERE "Name" = $1
    LIMIT 1
  `, [taskId]);
};

export const querySubmittedForm = (ticketId) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  return pool.query(`
    SELECT
      bmcservicedesk__input__c    AS "input",
      bmcservicedesk__response__c AS "response"
    FROM ${ticketSchema}.bmcservicedesk__srm_requestdetailinputs__c bsrc
    WHERE bmcservicedesk__fkrequestdetail__c = (
      SELECT id
      FROM ${ticketSchema}.bmcservicedesk__srm_requestdetail__c bsrc2
      WHERE bsrc2.bmcservicedesk__fkincident__c = $1
    )
    ORDER BY bsrc.lastmodifieddate
  `, [ticketId]);
};
