import pkg from "pg";
const { Pool } = pkg;
import { getConfig } from "./env.config.js";

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
      console.error("Unexpected error on idle client", err);
      process.exit(1);
    });
  }
  return pool;
};

export const checkConnection = async () => {
  try {
    console.log("Connecting to database...");
    const client = await getPool().connect();
    console.log("Database connected successfully.");
    client.release();
  } catch (err) {
    console.error("Failed to connect to the database:", err.message);
    process.exit(1);
  }
};

export { getPool };
export default getPool;
