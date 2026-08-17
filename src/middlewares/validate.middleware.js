import Joi from "joi";
import { MESSAGES } from "../constants/message.constants.js";

/**
 * Joi validation options applied globally across all schemas.
 * - abortEarly: false  → collect ALL errors, not just first
 * - stripUnknown: true → silently drop any key not in schema (body + query)
 * - convert: true      → coerce types (string "1" → number 1, etc.)
 */
const JOI_OPTIONS = {
  abortEarly: false,
  stripUnknown: true,
  convert: true,
};

/**
 * Formats Joi ValidationError details into a clean field-keyed object.
 * e.g. { email: "email is required", age: "age must be a number" }
 *
 * @param {import("joi").ValidationErrorItem[]} details
 * @returns {Record<string, string>}
 */
const formatErrors = (details) =>
  details.reduce((acc, { path, message }) => {
    const field = path.join(".");
    acc[field] = message.replace(/['"]/g, ""); // strip Joi quote decorators
    return acc;
  }, {});

/**
 * Factory — returns Express middleware that validates req[target] against schema.
 *
 * @param {import("joi").Schema} schema - Joi schema to validate against
 * @param {"body" | "query" | "params"} target - which req property to validate
 * @returns {import("express").RequestHandler}
 *
 * @example
 * import { validate } from "../middlewares/validate.middleware.js";
 * import { createTicketSchema } from "./ticket.schema.js";
 *
 * router.post("/", validate(createTicketSchema), createTicket);
 */
export const validate = (schema, target = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], JOI_OPTIONS);

    if (error) {
      const fields = formatErrors(error.details);
      return res.status(MESSAGES.validationError.statusCode).json({
        success: MESSAGES.validationError.statusFlag,
        message: MESSAGES.validationError.messageText,
        errors: fields,
      });
    }

    // Replace req[target] with stripped + coerced value so controller
    // only ever sees clean, schema-conformant data.
    // Express defines req.query as a getter-only property, so we use defineProperty.
    Object.defineProperty(req, target, {
      value: value,
      writable: true,
      enumerable: true,
      configurable: true
    });
    
    next();
  };
};
