import Joi from "joi";

const multiSelect = () =>
  Joi.array().items(Joi.string().trim()).single().default([]);

const dateStr = () => Joi.string().isoDate().optional();

// Shared filter fields — used by both get-data and get-filter-options
export const filterFields = {
  userId: Joi.number().integer().optional(),
  roleCode: Joi.string().trim().optional(),
  ticketType: Joi.string()
    .valid("ALL", "SERVICE_REQUEST", "INCIDENT", "TASK")
    .default("ALL"),
  queue:     multiSelect(),
  priority:  multiSelect(),
  status:    multiSelect(),
  employee:  multiSelect(),  // incident-only — forces incident table
  requestor: multiSelect(),  // incident-only — forces incident table
  categoryLevel1: multiSelect(), // incident-only
  categoryLevel2: multiSelect(), // incident-only
  categoryLevel3: multiSelect(), // incident-only
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
  globalSearch:    Joi.string().trim().max(500).optional(),
};

// Columns returned by get-data — used to whitelist sortBy
const SORTABLE_COLUMNS = [
  "ticketId",
  "ticketShortDesc",
  "ticketDescription",
  "ticketType",
  "ticketStatus",
  "staffName",
  "clientId",
  "ticketFormName",
  "ticketOpenDate",
];

export const getTicketsSchema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  // Multi-column sort: [{ col: "ticketStatus", dir: "asc" }, { col: "ticketOpenDate", dir: "desc" }]
  sort: Joi.array()
    .items(
      Joi.object({
        col: Joi.string().valid(...SORTABLE_COLUMNS).required(),
        dir: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .min(1)
    .max(SORTABLE_COLUMNS.length)
    .optional(),
  ...filterFields,
});

export const getFilterOptionsSchema = Joi.object({
  ...filterFields,
});

export const getTicketDetailsSchema = Joi.object({
  ticketId: Joi.string().trim().required(),
});

export const attachmentIdSchema = Joi.object({
  attachmentId: Joi.string().trim().required(),
});
