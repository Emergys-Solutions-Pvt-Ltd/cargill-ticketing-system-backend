import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export const loadConfig = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Local env detected. Using local .env variables.");
    return;
  }

  console.log("Production env detected. Fetching secrets from AWS...");

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

    const raw = response.SecretString ?? response.SecretBinary?.toString("utf-8");
    const secrets = JSON.parse(raw);

    // Inject AWS secrets into process.env — own keys only, String() ensures type safety
    Object.entries(secrets).forEach(([key, value]) => {
      process.env[key] = String(value);
    });

    console.log("AWS secrets loaded successfully.");
  } catch (error) {
    console.error("Failed to load AWS secrets:", error.message);
    process.exit(1); // Fail fast
  }
};