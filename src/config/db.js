import pkg from "pg";
const { Pool } = pkg;
import { getConfig } from "./env.config.js";
import logger from "../utils/logger.js";

let pool;

// Lazy-init: pool created on first call, after loadConfig() has run
const getPool = () => {
  if (!pool) {
    const config = getConfig();
    pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    });

    pool.on("error", (err) => {
      logger.fatal({ err }, "Unexpected error on idle DB client");
      process.exit(1);
    });
  }
  return pool;
};

export const checkConnection = async () => {
  try {
    logger.info("Connecting to database...");
    const client = await getPool().connect();
    logger.info("Database connected successfully.");
    client.release();
  } catch (err) {
    logger.fatal({ err }, "Failed to connect to database");
    process.exit(1);
  }
};

export { getPool };
export default getPool;
