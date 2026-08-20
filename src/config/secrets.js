export const loadConfig = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Local env detected. Using local .env variables.");
    return;
  }

  console.log("Production env detected. Fetching secrets from HashiCorp Vault...");

  const vaultAddr = process.env.VAULT_ADDR || "http://127.0.0.1:8200";
  const vaultToken = process.env.VAULT_TOKEN;
  const secretPath = process.env.VAULT_SECRET_PATH || "secret/data/prod/cargil/api"; // KV v2 format

  if (!vaultToken) {
    console.error("Failed to load Vault secrets: VAULT_TOKEN is missing.");
    process.exit(1);
  }

  try {
    const response = await fetch(`${vaultAddr}/v1/${secretPath}`, {
      method: "GET",
      headers: {
        "X-Vault-Token": vaultToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Vault API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    
    // Vault KV v2 structure wraps actual secrets in data.data
    const secrets = json.data?.data || json.data || {};

    // Inject Vault secrets into process.env
    Object.entries(secrets).forEach(([key, value]) => {
      process.env[key] = String(value);
    });

    console.log("HashiCorp Vault secrets loaded successfully.");
  } catch (error) {
    console.error("Failed to load Vault secrets:", error.message);
    process.exit(1); // Fail fast
  }
};