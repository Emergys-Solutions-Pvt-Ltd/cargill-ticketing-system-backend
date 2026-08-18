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

/**
 * Fetches the Service Request fields required by the detail screen.
 * The source table/columns deliberately use the actual Salesforce replica names.
 *
 * @param {string} ticketId Service request number, for example SR0001234
 * @returns {Promise<pg.QueryResult>}
 */
export const queryTicketDetails = (ticketId) => {
  const pool = getPool();

  const sql = `
    SELECT
      "BMCServiceDesk__FKContact__c"            AS "contact",
      "EmployeeName__c"                         AS "employee",
      "Requestor_Contact__c"                    AS "requestor",
      "Self_Service_Requestor__c"               AS "selfServiceRequestor",

      "BMCServiceDesk__FKTemplate__c"           AS "template",
      "BMCServiceDesk__FKRequestDefinition__c"  AS "requestDefinition",

      "BMCServiceDesk__FKImpact__c"             AS "impact",
      "BMCServiceDesk__FKUrgency__c"            AS "urgency",
      "BMCServiceDesk__FKPriority__c"           AS "priority",
      "BMCServiceDesk__FKStatus__c"             AS "status",

      "BMCServiceDesk__Queue__c"                AS "queue",
      "BMCServiceDesk__FKOpenBy__c"             AS "staff"
    FROM gold1."BMCServiceDesk__Incident__c"
    WHERE "Name" = $1
    LIMIT 1
  `;

  return pool.query(sql, [ticketId]);
};
