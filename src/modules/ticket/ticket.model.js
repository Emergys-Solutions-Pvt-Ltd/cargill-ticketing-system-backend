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
export const queryServiceRequestFormDetails = (ticketId) => {
  const pool = getPool();

  const sql = `
    SELECT
      "contact_formula__c"            AS "contact",
      "EmployeeName__c"                         AS "employee",
      "Requestor_Contact__c"                    AS "requestor",
      "Self_Service_Requestor__c"               AS "selfServiceRequestor",
      "From_Email_Address__c"                   AS "fromEmailAddress",

      "template_name_formula__c"           AS "template",
      "request_definition_formula__c"  AS "requestDefinition",
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

      "BMCServiceDesk__Impact_Id__c"             AS "impact",
      "BMCServiceDesk__Urgency_ID__c"            AS "urgency",
      "BMCServiceDesk__Priority_ID__c"           AS "priority",
      "BMCServiceDesk__Status_ID__c"             AS "status",
      "BMCServiceDesk__firstCallResolution__c"  AS "firstCallResolution",
      "BMCServiceDesk__ClosureCategory__c"      AS "closureCategory",

      "Resolved_Date__c"                        AS "resolvedDate",
      "BMCServiceDesk__dueDateTime__c"          AS "dueDate",
      "BMCServiceDesk__closeDateTime__c"        AS "closedDate",
      "BMCServiceDesk__respondedDateTime__c"    AS "respondedDate",

      "BMCServiceDesk__Queue__c"                AS "queue",
      "Staff_Email__c"             AS "staff"
    FROM gold1."BMCServiceDesk__Incident__c"
    WHERE "Name" = $1
    LIMIT 1
  `;

  return pool.query(sql, [ticketId]);
};
