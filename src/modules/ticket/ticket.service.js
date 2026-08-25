import {
  queryTickets,
  countTickets,
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
// Helpers
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
// Ticket (Incident / Service Request) services
// ---------------------------------------------------------------------------

/**
 * Fetches paginated tickets.
 *
 * @param {{ page: number, pageSize: number }} params
 * @returns {Promise<{ tickets: object[], pagination: object }>}
 */
export const fetchTickets = async ({ page, pageSize }) => {
  const offset = (page - 1) * pageSize;

  const [dataResult, countResult] = await Promise.all([
    queryTickets(pageSize, offset),
    countTickets(),
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

/**
 * Fetches service request form details.
 *
 * @param {{ ticketId: string }} params
 * @returns {Promise<object|null>}
 */
export const fetchServiceRequestFormDetails = async ({ ticketId }) => {
  const result = await queryServiceRequestFormDetails(ticketId);
  const row = result.rows[0];
  if (!row) return null;
  return mapFormDetails(row);
};

/**
 * Fetches all accordion detail sections for a ticket (incident) in parallel.
 *
 * @param {{ ticketId: string }} params
 * @returns {Promise<object>}
 */
export const fetchTicketDetails = async ({ ticketId }) => {
  const [
    actionHistoryResult,
    notesAttachmentsResult,
    approvalHistoryResult,
    incidentHistoryResult,
    linkedTasksResult,
    linkedIncidentsResult,
  ] = await Promise.all([
    queryActionHistory(ticketId),
    queryNotesAndAttachments(ticketId),
    queryApprovalHistory(ticketId),
    queryIncidentHistory(ticketId),
    queryLinkedTasks(ticketId),
    queryLinkedIncidents(ticketId),
  ]);

  return {
    actionHistory:       actionHistoryResult.rows,
    notesAndAttachments: notesAttachmentsResult.rows,
    approvalHistory:     approvalHistoryResult.rows,
    incidentHistory:     incidentHistoryResult.rows,
    linkedTasks:         linkedTasksResult.rows,
    linkedIncidents:     linkedIncidentsResult.rows,
  };
};

// ---------------------------------------------------------------------------
// Task services
// ---------------------------------------------------------------------------

/**
 * Fetches task form details (same shape as service request form).
 *
 * @param {{ taskId: string }} params
 * @returns {Promise<object|null>}
 */
export const fetchTaskFormDetails = async ({ taskId }) => {
  const result = await queryTaskFormDetails(taskId);
  const row = result.rows[0];
  if (!row) return null;
  return mapFormDetails(row);
};

/**
 * Fetches all accordion detail sections for a task in parallel.
 *
 * @param {{ taskId: string }} params
 * @returns {Promise<object>}
 */
export const fetchTaskDetails = async ({ taskId }) => {
  const [
    actionHistoryResult,
    notesAttachmentsResult,
    approvalHistoryResult,
    incidentHistoryResult,
    linkedTasksResult,
    linkedIncidentsResult,
  ] = await Promise.all([
    queryTaskActionHistory(taskId),
    queryTaskNotesAndAttachments(taskId),
    queryTaskApprovalHistory(taskId),
    queryTaskIncidentHistory(taskId),
    queryTaskLinkedTasks(taskId),
    queryTaskLinkedIncidents(taskId),
  ]);

  return {
    actionHistory:       actionHistoryResult.rows,
    notesAndAttachments: notesAttachmentsResult.rows,
    approvalHistory:     approvalHistoryResult.rows,
    incidentHistory:     incidentHistoryResult.rows,
    linkedTasks:         linkedTasksResult.rows,
    linkedIncidents:     linkedIncidentsResult.rows,
  };
};

/**
 * Fetches submitted form for a service request.
 * Transforms rows into a fully dynamic structure:
 *   - rows where response === "header section" (case-insensitive) → { type: "header", title }
 *   - all other rows                                               → { type: "field",  label, value }
 * Zero hard-coded knowledge of header names — the DB drives everything.
 *
 * @param {{ ticketId: string }} params
 * @returns {Promise<Array<{ type: "header"|"field", title?: string, label?: string, value?: string }>>}
 */
export const fetchSubmittedForm = async ({ ticketId }) => {
  const result = await querySubmittedForm(ticketId);

  return result.rows.map((row) => {
    const normalizedResponse = String(row.response ?? "").trim().toLowerCase();

    if (normalizedResponse === "header section") {
      return {
        type: "header",
        title: row.input,
      };
    }

    return {
      type: "field",
      label: row.input,
      value: row.response,
    };
  });
};
