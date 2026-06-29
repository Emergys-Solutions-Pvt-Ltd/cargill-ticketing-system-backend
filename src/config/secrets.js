import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import logger from "../utils/logger.js";

export const loadConfig = async () => {
  if (process.env.NODE_ENV !== "production") {
    logger.info("Local env detected. Using local .env variables.");
    return;
  }

  logger.info("Production env detected. Fetching secrets from AWS...");

  const secretName = process.env.AWS_SECRET_NAME || "prod/cargil/api";
  const region = process.env.AWS_REGION || "us-east-1";

  const client = new SecretsManagerClient({ region });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT",
      })
    );

    const secrets = JSON.parse(response.SecretString);

    // Inject AWS secrets into process.env
    for (const key in secrets) {
      process.env[key] = secrets[key];
    }

    logger.info("AWS secrets loaded successfully.");
  } catch (error) {
    logger.fatal({ err: error }, "Failed to load AWS secrets");
    process.exit(1); // Fail fast
  }
};