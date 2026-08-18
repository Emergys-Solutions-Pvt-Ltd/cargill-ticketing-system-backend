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
    },
    incidentDetails: {
      template: ticket.template,
      requestDefinition: ticket.requestDefinition,
    },
    statusAndPriority: {
      impact: ticket.impact,
      urgency: ticket.urgency,
      priority: ticket.priority,
      status: ticket.status,
    },
    assignmentDetails: {
      queue: ticket.queue,
      staff: ticket.staff,
    },
  };
};
