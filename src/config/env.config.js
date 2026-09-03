const validateEnv = () => {
  const requiredFields = [
    "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME",
    "AZURE_AD_CLIENT_ID", "AZURE_AD_TENANT_ID",
    "RBAC_SCHEMA", "APP_TYPE",
  ];
  const missing = requiredFields.filter((field) => !process.env[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const config = {
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV,
    db: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    azureAd: {
      clientId: process.env.AZURE_AD_CLIENT_ID,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET, // optional for API
    },
    rbacSchema: process.env.RBAC_SCHEMA,  // "rbac" — matches env typo intentionally
    appType: process.env.APP_TYPE,         // "HR" | "GENERIC"
  };

  // deep freez obj to ensure immutability
  Object.freeze(config.db);
  Object.freeze(config.azureAd);
  return Object.freeze(config);
};

let configInstance;

export const getConfig = () => {
  if (!configInstance) {
    configInstance = validateEnv();
  }
  return configInstance;
};
