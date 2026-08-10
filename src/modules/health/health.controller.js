import { checkHealthService } from "./health.service.js";
import { MESSAGES } from "../../constants/message.constants.js";
import asyncWrapper from "../../utils/asyncWrapper.js";

export const getHealth = asyncWrapper(async (req, res) => {
  const healthInfo = checkHealthService();
  return res.sendResponse(MESSAGES.healthCheck, healthInfo);
});
