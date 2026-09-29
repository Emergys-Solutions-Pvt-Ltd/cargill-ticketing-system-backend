import Joi from "joi";
import { filterFields } from "./ticket.schema.js";

// ---------------------------------------------------------------------------
// Sort entry schema
// ---------------------------------------------------------------------------

/**
 * Allowed column names match the aliased output columns in ticket2.model.js.
 */
const SORTABLE_COLS = [
  "ticketStatus",
  "ticketOpenDate",
  "ticketShortDesc",
  "ticketDescription",
  "ticketType",
  "staffName",
  "ticketId",
  "clientId",
  "ticketFormName",
];

const sortItemSchema = Joi.object({
  col: Joi.string()
    .valid(...SORTABLE_COLS)
    .required()
    .messages({
      "any.only": `"col" must be one of: ${SORTABLE_COLS.join(", ")}`,
    }),
  dir: Joi.string()
    .valid("asc", "desc")
    .required()
    .messages({
      "any.only": '"dir" must be "asc" or "desc"',
    }),
});

// ---------------------------------------------------------------------------
// Main schema for POST /get-data-v2
// ---------------------------------------------------------------------------

export const getTickets2Schema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),

  /**
   * Multi-level sort array.
   * Example:
   *   [
   *     { "col": "ticketStatus",   "dir": "asc"  },
   *     { "col": "ticketOpenDate", "dir": "desc" }
   *   ]
   * Optional — if omitted, no ORDER BY is applied (DB natural order).
   */
  sort: Joi.array()
    .items(sortItemSchema)
    .max(5)           // guard against absurdly large sort arrays
    .default([])
    .optional(),

  ...filterFields,
});
