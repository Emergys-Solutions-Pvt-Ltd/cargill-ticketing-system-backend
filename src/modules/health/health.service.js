import logger from "../../utils/logger.js";

export const checkHealthService = () => {
  logger.debug("Health service: executing health check...");
  return {
    status: "UP",
    timestamp: new Date().toISOString()
  };
};
