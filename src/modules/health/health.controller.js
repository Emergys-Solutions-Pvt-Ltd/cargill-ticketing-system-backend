import { checkHealth } from "./health.service.js";
import { MESSAGES } from "../../constants/message.constants.js";

export const getHealth = (req, res, next) => {
  try {
    const healthInfo = checkHealth();
    return res.sendResponse(MESSAGES.healthCheck, healthInfo);
  } catch (error) {
    next(error);
  }
};
