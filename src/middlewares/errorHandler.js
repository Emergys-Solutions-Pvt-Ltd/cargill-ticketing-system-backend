import { MESSAGES } from "../constants/message.constants.js";

const errorHandler = (err, req, res, next) => {
  console.error("Error caught by handler:", err);

  const statusCode = err.statusCode || MESSAGES.internalServerError.statusCode;
  const messageText = err.message || MESSAGES.internalServerError.messageText;
  const statusFlag = err.statusFlag !== undefined ? err.statusFlag : MESSAGES.internalServerError.statusFlag;

  res.status(statusCode).json({
    success: statusFlag,
    message: messageText,
  });
};

export default errorHandler;
