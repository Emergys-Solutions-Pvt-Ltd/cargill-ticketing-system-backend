import Joi from "joi";

// Accepts single string OR array of strings from query params
// e.g. ?queue=IT  OR  ?queue=IT&queue=HR
const multiSelect = () =>
  Joi.array().items(Joi.string().trim()).single().default([]);

// ISO date string — used for date range bounds
const dateStr = () => Joi.string().isoDate().optional();

/**
 * Shared filter fields — used by both get-data and filter-options.
 * Extracted to avoid duplication.
 */
const filterFields = {
  // Multi-select dropdowns
  employee:    multiSelect(),
  requestor:   multiSelect(),
  fromEmail:   multiSelect(),
  emailSentTo: multiSelect(),
  queue:       multiSelect(),
  priority:    multiSelect(),
  status:      multiSelect(),
  resolution:  multiSelect(),

  // Date ranges (all optional, independent from/to bounds)
  resolvedDateFrom: dateStr(),
  resolvedDateTo:   dateStr(),
  dueDateFrom:      dateStr(),
  dueDateTo:        dateStr(),
  closedDateFrom:   dateStr(),
  closedDateTo:     dateStr(),
  openDateFrom:     dateStr(),
  openDateTo:       dateStr(),

  // Free text search
  shortDescription: Joi.string().trim().max(200).optional(),
  description:      Joi.string().trim().max(200).optional(),
};

/**
 * Schema for POST /tickets/get-data
 * Pagination + all filters.
 */
export const getTicketsSchema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  ...filterFields,
});

/**
 * Schema for POST /tickets/filter-options
 * Same filters, no pagination — used to compute dependent dropdown values.
 */
export const getFilterOptionsSchema = Joi.object({
  ...filterFields,
});
