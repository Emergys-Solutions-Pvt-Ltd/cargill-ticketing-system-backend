import Joi from "joi";

const multiSelect = () =>
  Joi.array().items(Joi.string().trim()).single().default([]);

const dateStr = () => Joi.string().isoDate().optional();

// Shared filter fields — used by both get-data and get-filter-options
export const filterFields = {
  ticketType: Joi.string()
    .valid("ALL", "SERVICE_REQUEST", "INCIDENT", "TASK")
    .default("ALL"),
  queue:     multiSelect(),
  priority:  multiSelect(),
  status:    multiSelect(),
  employee:  multiSelect(),  // incident-only — forces incident table
  requestor: multiSelect(),  // incident-only — forces incident table
  shortDescription: Joi.string().trim().max(200).optional(),
  description:      Joi.string().trim().max(200).optional(),
  resolution:       Joi.string().trim().max(200).optional(),
  openDateFrom:    dateStr(),
  openDateTo:      dateStr(),
  dueDateFrom:     dateStr(),
  dueDateTo:       dateStr(),
  resolveDateFrom: dateStr(), // incident-only — forces incident table
  resolveDateTo:   dateStr(), // incident-only — forces incident table
  closedDateFrom:  dateStr(),
  closedDateTo:    dateStr(),
};

export const getTicketsSchema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  ...filterFields,
});

export const getFilterOptionsSchema = Joi.object({
  ...filterFields,
});

export const getTicketDetailsSchema = Joi.object({
  ticketId: Joi.string().trim().required(),
});
