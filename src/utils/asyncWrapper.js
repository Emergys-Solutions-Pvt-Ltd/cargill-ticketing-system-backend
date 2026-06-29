/**
 * Wraps an async controller/middleware function and forwards any
 * rejected promise to Express's next(err) — eliminating try/catch boilerplate.
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function} Express-compatible middleware
 *
 * @example
 * // Before — every controller needs try/catch:
 * export const getTicket = async (req, res, next) => {
 *   try {
 *     const data = await ticketService.findById(req.params.id);
 *     res.sendResponse(MESSAGES.success, data);
 *   } catch (err) {
 *     next(err);
 *   }
 * };
 *
 * // After — zero try/catch noise:
 * export const getTicket = asyncWrapper(async (req, res) => {
 *   const data = await ticketService.findById(req.params.id);
 *   res.sendResponse(MESSAGES.success, data);
 * });
 */
const asyncWrapper = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncWrapper;
