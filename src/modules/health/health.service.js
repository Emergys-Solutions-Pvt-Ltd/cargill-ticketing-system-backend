export const checkHealth = () => {
  console.log("Health service: executing health check...");
  return {
    status: "UP",
    timestamp: new Date().toISOString()
  };
};
