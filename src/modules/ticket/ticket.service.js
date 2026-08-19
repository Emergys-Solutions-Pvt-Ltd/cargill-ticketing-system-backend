import {
  queryTickets,
  countTickets,
  queryServiceRequestFormDetails,
} from "./ticket.model.js";

/**
 * Fetches paginated tickets.
 *
 * @param {object} params
 * @param {number} params.page      - Current page (1-indexed)
 * @param {number} params.pageSize  - Rows per page
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
 * Fetches data for the Service Request detail accordions.
 *
 * @param {{ ticketId: string }} params
 * @returns {Promise<object|null>}
 */
export const fetchServiceRequestFormDetails = async ({ ticketId }) => {
  const result = await queryServiceRequestFormDetails(ticketId);
  const ticket = result.rows[0];

  if (!ticket) return null;

  return {
    clientDetails: {
      contact: ticket.contact,
      employee: ticket.employee,
      requestor: ticket.requestor,
      selfServiceRequestor: ticket.selfServiceRequestor,
      fromEmailAddress: ticket.fromEmailAddress,
    },
    incidentDetails: {
      template: ticket.template,
      requestDefinition: ticket.requestDefinition,
      categoryLevel1: ticket.categoryLevel1,
      categoryLevel2: ticket.categoryLevel2,
      categoryLevel3: ticket.categoryLevel3,
      categoryMoreInfo: ticket.categoryMoreInfo,
      shortDescription: ticket.shortDescription,
      reopenReason: ticket.reopenReason,
      description: ticket.description,
      resolution: ticket.resolution,
      totalWorkTimeMinutes: ticket.totalWorkTimeMinutes,
      transactionCount: ticket.transactionCount,
      emailSentTo: ticket.emailSentTo,
      incidentType: ticket.incidentType,
      allTasksClosedController: ticket.allTasksClosedController,
      incidentSource: ticket.incidentSource,
      followUp: ticket.followUp,
      escalatedIssue: ticket.escalatedIssue,
    },
    statusAndPriority: {
      impact: ticket.impact,
      urgency: ticket.urgency,
      priority: ticket.priority,
      status: ticket.status,
      firstCallResolution: ticket.firstCallResolution,
      closureCategory: ticket.closureCategory,
    },
    dateAndTimeDetails: {
      resolvedDate: ticket.resolvedDate,
      dueDate: ticket.dueDate,
      closedDate: ticket.closedDate,
      respondedDate: ticket.respondedDate,
    },
    assignmentDetails: {
      queue: ticket.queue,
      staff: ticket.staff,
    },
  };
};
