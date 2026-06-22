const validateEnv = () => {
  const requiredFields = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = requiredFields.filter((field) => !process.env[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const config = {
    port: process.env.PORT,
    env: process.env.NODE_ENV,
    db: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
  };

  // deep freez obj to ensure immutability
  Object.freeze(config.db);
  return Object.freeze(config);
};

let configInstance;

export const getConfig = () => {
  if (!configInstance) {
    configInstance = validateEnv();
  }
  return configInstance;
};
