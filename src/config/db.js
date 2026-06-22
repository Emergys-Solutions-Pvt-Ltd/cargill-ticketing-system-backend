import pkg from "pg";
const { Pool } = pkg;
import { getConfig } from "./env.config.js";

const config = getConfig();

const pool = new Pool({
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

export const checkConnection = async () => {
  try {
    console.log("Connecting to database...");
    const client = await pool.connect();
    console.log("Database connected successfully.");
    client.release();
  } catch (err) {
    console.error("Failed to connect to the database:", err.message);
    process.exit(1);
  }
};

export default pool;
