import dotenv from "dotenv";
dotenv.config({ quiet: true });

import { loadConfig } from "./config/secrets.js";
const startServer = async () => {
  await loadConfig();
  const { default: app } = await import("./app.js");
  const { checkConnection } = await import("./config/db.js");
  const { getConfig } = await import("./config/env.config.js");
  const { default: logger } = await import("./utils/logger.js");

  const config = getConfig();

  // DB Connection
  await checkConnection();

  app.listen(config.port || 3000, () => {
    logger.info({ port: config.port || 3000 }, "Server running");
  });
};

startServer();