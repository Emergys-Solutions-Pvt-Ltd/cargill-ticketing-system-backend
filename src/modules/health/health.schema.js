import Joi from "joi";

/**
 * Example schema — demonstrates pattern for all future modules.
 *
 * Usage in routes:
 *   import { validate } from "../../middlewares/validate.middleware.js";
 *   import { healthQuerySchema } from "./health.schema.js";
 *   router.get("/", validate(healthQuerySchema, "query"), getHealth);
 */
export const healthQuerySchema = Joi.object({
  // example optional query param; extend as needed
  format: Joi.string().valid("json", "text").default("json"),
});
