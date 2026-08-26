import {
  resolveTableMode,
  buildIncidentWhereClause,
  buildTaskWhereClause,
  queryIncidentTickets,
  queryTaskTickets,
  queryUnionTickets,
  countIncidentTickets,
  countTaskTickets,
  countUnionTickets,
  queryIncidentDistinct,
  queryTaskDistinct,
  queryUnionDistinct,
  queryServiceRequestFormDetails,
  queryTaskFormDetails,
  querySubmittedForm,
} from "./ticket.model.js";

import {
  queryActionHistory,
  queryNotesAndAttachments,
  queryApprovalHistory,
  queryIncidentHistory,
  queryLinkedTasks,
  queryLinkedIncidents,
  queryTaskActionHistory,
  queryTaskNotesAndAttachments,
  queryTaskApprovalHistory,
  queryTaskIncidentHistory,
  queryTaskLinkedTasks,
  queryTaskLinkedIncidents,
} from "./ticket.details.model.js";

// ---------------------------------------------------------------------------
// Shared form detail mapper
// ---------------------------------------------------------------------------

const mapFormDetails = (row) => ({
  clientDetails: {
    contact: row.contact,
    employee: row.employee,
    requestor: row.requestor,
    selfServiceRequestor: row.selfServiceRequestor,
    fromEmailAddress: row.fromEmailAddress,
  },
  incidentDetails: {
    template: row.template,
    requestDefinition: row.requestDefinition,
    categoryLevel1: row.categoryLevel1,
    categoryLevel2: row.categoryLevel2,
    categoryLevel3: row.categoryLevel3,
    categoryMoreInfo: row.categoryMoreInfo,
    shortDescription: row.shortDescription,
    reopenReason: row.reopenReason,
    description: row.description,
    resolution: row.resolution,
    totalWorkTimeMinutes: row.totalWorkTimeMinutes,
    transactionCount: row.transactionCount,
    emailSentTo: row.emailSentTo,
    incidentType: row.incidentType,
    allTasksClosedController: row.allTasksClosedController,
    incidentSource: row.incidentSource,
    followUp: row.followUp,
    escalatedIssue: row.escalatedIssue,
  },
  statusAndPriority: {
    impact: row.impact,
    urgency: row.urgency,
    priority: row.priority,
    status: row.status,
    firstCallResolution: row.firstCallResolution,
    closureCategory: row.closureCategory,
  },
  dateAndTimeDetails: {
    resolvedDate: row.resolvedDate,
    dueDate: row.dueDate,
    closedDate: row.closedDate,
    respondedDate: row.respondedDate,
  },
  assignmentDetails: {
    queue: row.queue,
    staff: row.staff,
  },
});

// ---------------------------------------------------------------------------
// Ticket list (with filters)
// ---------------------------------------------------------------------------

/**
 * Fetches paginated, filtered tickets.
 * Automatically selects table mode (INCIDENT_ONLY / TASK_ONLY / UNION).
 */
export const fetchTickets = async ({ page, pageSize, ...filters }) => {
  const offset = (page - 1) * pageSize;
  const mode   = resolveTableMode(filters);

  let dataResult, countResult;

  if (mode === "INCIDENT_ONLY") {
    const { whereClause, params } = buildIncidentWhereClause(filters);
    [dataResult, countResult] = await Promise.all([
      queryIncidentTickets(whereClause, params, pageSize, offset),
      countIncidentTickets(whereClause, params),
    ]);
  } else if (mode === "TASK_ONLY") {
    const { whereClause, params } = buildTaskWhereClause(filters);
    [dataResult, countResult] = await Promise.all([
      queryTaskTickets(whereClause, params, pageSize, offset),
      countTaskTickets(whereClause, params),
    ]);
  } else {
    // UNION — build both WHERE clauses independently
    const inc  = buildIncidentWhereClause(filters);
    const task = buildTaskWhereClause(filters);
    [dataResult, countResult] = await Promise.all([
      queryUnionTickets(inc.whereClause, inc.params, task.whereClause, task.params, pageSize, offset),
      countUnionTickets(inc.whereClause, inc.params, task.whereClause, task.params),
    ]);
  }

  const total      = parseInt(countResult.rows[0].total, 10);
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

// ---------------------------------------------------------------------------
// Filter options (dependent dropdowns)
// ---------------------------------------------------------------------------

/**
 * Returns available dropdown options constrained by current filters.
 * Options for queue, priority, status are dependent on each other.
 * Employee and requestor are incident-only.
 *
 * @param {object} filters
 * @returns {{ queue, priority, status, employee, requestor }}
 */
export const fetchFilterOptions = async (filters = {}) => {
  const mode = resolveTableMode(filters);

  const inc  = mode !== "TASK_ONLY"     ? buildIncidentWhereClause(filters) : null;
  const task = mode !== "INCIDENT_ONLY" ? buildTaskWhereClause(filters)     : null;

  const toValues = (result) => result.rows.map((r) => r.value).filter(Boolean);

  const getDistinct = (col, incidentOnly = false) => {
    if (incidentOnly || mode === "INCIDENT_ONLY") {
      return queryIncidentDistinct(col, inc.whereClause, inc.params).then(toValues);
    }
    if (mode === "TASK_ONLY") {
      return queryTaskDistinct(col, task.whereClause, task.params).then(toValues);
    }
    // UNION — merge distinct from both tables
    return queryUnionDistinct(col, inc.whereClause, inc.params, task.whereClause, task.params).then(toValues);
  };

  const [queue, priority, status, employee, requestor] = await Promise.all([
    getDistinct("bmcservicedesk__queue__c"),
    getDistinct("bmcservicedesk__fkpriority__c"),
    getDistinct("bmcservicedesk__fkstatus__c"),
    getDistinct("employeename__c",      true),  // incident only
    getDistinct("requestor_contact__c", true),  // incident only
  ]);

  return { queue, priority, status, employee, requestor };
};

// ---------------------------------------------------------------------------
// Detail form services
// ---------------------------------------------------------------------------

export const fetchServiceRequestFormDetails = async ({ ticketId }) => {
  const result = await queryServiceRequestFormDetails(ticketId);
  const row = result.rows[0];
  if (!row) return null;
  return mapFormDetails(row);
};

export const fetchTicketDetails = async ({ ticketId }) => {
  const [a, b, c, d, e, f] = await Promise.all([
    queryActionHistory(ticketId),
    queryNotesAndAttachments(ticketId),
    queryApprovalHistory(ticketId),
    queryIncidentHistory(ticketId),
    queryLinkedTasks(ticketId),
    queryLinkedIncidents(ticketId),
  ]);
  return {
    actionHistory:       a.rows,
    notesAndAttachments: b.rows,
    approvalHistory:     c.rows,
    incidentHistory:     d.rows,
    linkedTasks:         e.rows,
    linkedIncidents:     f.rows,
  };
};

export const fetchTaskFormDetails = async ({ taskId }) => {
  const result = await queryTaskFormDetails(taskId);
  const row = result.rows[0];
  if (!row) return null;
  return mapFormDetails(row);
};

export const fetchTaskDetails = async ({ taskId }) => {
  const [a, b, c, d, e, f] = await Promise.all([
    queryTaskActionHistory(taskId),
    queryTaskNotesAndAttachments(taskId),
    queryTaskApprovalHistory(taskId),
    queryTaskIncidentHistory(taskId),
    queryTaskLinkedTasks(taskId),
    queryTaskLinkedIncidents(taskId),
  ]);
  return {
    actionHistory:       a.rows,
    notesAndAttachments: b.rows,
    approvalHistory:     c.rows,
    incidentHistory:     d.rows,
    linkedTasks:         e.rows,
    linkedIncidents:     f.rows,
  };
};

export const fetchSubmittedForm = async ({ ticketId }) => {
  const result = await querySubmittedForm(ticketId);
  return result.rows.map((row) => {
    const normalizedResponse = String(row.response ?? "").trim().toLowerCase();
    if (normalizedResponse === "header section") {
      return { type: "header", title: row.input };
    }
    return { type: "field", label: row.input, value: row.response };
  });
};
