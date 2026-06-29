import { MESSAGES } from "../constants/message.constants.js";
import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  // Operational error (thrown via AppError) — safe to expose message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unexpected crash — log full stack, never leak internals to client
  logger.error({ err }, "Unhandled error");

  return res.status(MESSAGES.internalServerError.statusCode).json({
    success: MESSAGES.internalServerError.statusFlag,
    message: MESSAGES.internalServerError.messageText,
  });
};

export default errorHandler;
