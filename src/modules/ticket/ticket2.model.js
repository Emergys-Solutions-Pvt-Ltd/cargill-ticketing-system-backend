import getPool from "../../config/db.js";
import { getConfig } from "../../config/env.config.js";

// Re-export shared WHERE-clause builders and resolveTableMode from the
// original model so ticket2.service.js doesn't need to import from two places.
export {
  resolveTableMode,
  buildIncidentWhereClause,
  buildTaskWhereClause,
} from "./ticket.model.js";

// ---------------------------------------------------------------------------
// Column alias allow-list
// These are the aliased column names produced by the SELECT projections below.
// ONLY these names are accepted in the sort payload — anything else is rejected.
// ---------------------------------------------------------------------------
const ALLOWED_SORT_COLS = new Set([
  "ticketStatus",
  "ticketOpenDate",
  "ticketShortDesc",
  "ticketDescription",
  "ticketType",
  "staffName",
  "ticketId",
  "clientId",
  "ticketFormName",
]);

/**
 * Builds a safe ORDER BY clause from an array of { col, dir } objects.
 *
 * @param {Array<{ col: string, dir: "asc"|"desc" }>} sort
 * @returns {string}  e.g. `ORDER BY "ticketStatus" ASC, "ticketOpenDate" DESC`
 *                    Falls back to empty string when sort is empty/invalid.
 */
export const buildSortClause = (sort = []) => {
  if (!Array.isArray(sort) || sort.length === 0) return "";

  const parts = sort
    .filter(({ col, dir }) => {
      const colOk = ALLOWED_SORT_COLS.has(col);
      const dirOk = dir === "asc" || dir === "desc";
      if (!colOk) console.warn(`[ticket2.model] Ignored unknown sort col: ${col}`);
      if (!dirOk) console.warn(`[ticket2.model] Ignored invalid sort dir: ${dir}`);
      return colOk && dirOk;
    })
    .map(({ col, dir }) => `"${col}" ${dir.toUpperCase()}`);

  return parts.length > 0 ? `ORDER BY ${parts.join(", ")}` : "";
};

// ---------------------------------------------------------------------------
// Shared column projections (identical to ticket.model.js)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Query functions — identical signature to ticket.model.js except they accept
// a `sort` array instead of a hard-coded ORDER BY.
// ---------------------------------------------------------------------------

/**
 * @param {string} whereClause
 * @param {Array}  params
 * @param {number} pageSize
 * @param {number} offset
 * @param {Array<{ col: string, dir: "asc"|"desc" }>} sort
 */
export const queryIncidentTickets2 = (whereClause, params, pageSize, offset, sort) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  const p = params.length;
  const orderBy = buildSortClause(sort);

  return pool.query(
    `SELECT ${INCIDENT_COLS} FROM ${ticketSchema}.bmcservicedesk__incident__c ${whereClause}
     ${orderBy}
     LIMIT $${p + 1} OFFSET $${p + 2}`,
    [...params, pageSize, offset]
  );
};

/**
 * @param {string} whereClause
 * @param {Array}  params
 * @param {number} pageSize
 * @param {number} offset
 * @param {Array<{ col: string, dir: "asc"|"desc" }>} sort
 */
export const queryTaskTickets2 = (whereClause, params, pageSize, offset, sort) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  const p = params.length;
  const orderBy = buildSortClause(sort);

  return pool.query(
    `SELECT ${TASK_COLS} FROM ${ticketSchema}.bmcservicedesk__task__c ${whereClause}
     ${orderBy}
     LIMIT $${p + 1} OFFSET $${p + 2}`,
    [...params, pageSize, offset]
  );
};

/**
 * @param {string} incWhere
 * @param {Array}  incParams
 * @param {string} taskWhere
 * @param {Array}  taskParams
 * @param {number} pageSize
 * @param {number} offset
 * @param {Array<{ col: string, dir: "asc"|"desc" }>} sort
 */
export const queryUnionTickets2 = (incWhere, incParams, taskWhere, taskParams, pageSize, offset, sort) => {
  const pool = getPool();
  const { ticketSchema } = getConfig();
  const iLen = incParams.length;
  const tLen = taskParams.length;
  const taskWhereReindexed = taskWhere.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + iLen}`);
  const orderBy = buildSortClause(sort);

  const sql = `
    SELECT * FROM (
      SELECT ${INCIDENT_COLS} FROM ${ticketSchema}.bmcservicedesk__incident__c ${incWhere}
      UNION ALL
      SELECT ${TASK_COLS} FROM ${ticketSchema}.bmcservicedesk__task__c ${taskWhereReindexed}
    ) combined
    ${orderBy}
    LIMIT $${iLen + tLen + 1} OFFSET $${iLen + tLen + 2}
  `;

  return pool.query(sql, [...incParams, ...taskParams, pageSize, offset]);
};

// ---------------------------------------------------------------------------
// Count functions — unchanged from ticket.model.js, re-exported for convenience
// ---------------------------------------------------------------------------
export {
  countIncidentTickets,
  countTaskTickets,
  countUnionTickets,
} from "./ticket.model.js";
