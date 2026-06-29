/**
 * Operational error — thrown intentionally by app logic.
 * errorHandler distinguishes this from unexpected crashes.
 *
 * @example
 * throw new AppError("Ticket not found", 404);
 * throw new AppError("Insufficient permissions", 403);
 */
class AppError extends Error {
  /**
   * @param {string} message  - Human-readable error message sent to client
   * @param {number} statusCode - HTTP status code (default 500)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.statusFlag = false;
    this.isOperational = true; // flag: known error, not a bug

    // Preserve correct stack trace (V8 only)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
