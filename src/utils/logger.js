import pino from "pino";

/**
 * Singleton pino logger — import this everywhere instead of console.
 *
 * Levels:   logger.trace / .debug / .info / .warn / .error / .fatal
 * Dev:      pretty-printed, human-readable (NODE_ENV !== "production")
 * Prod:     raw JSON — ship to CloudWatch / Datadog / ELK as-is
 *
 * @example
 * import logger from "../utils/logger.js";
 * logger.info("Server started");
 * logger.error({ err }, "DB connection failed");
 */
const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  // Pretty print in dev only — pino-pretty not needed in prod (costs perf)
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});

export default logger;
