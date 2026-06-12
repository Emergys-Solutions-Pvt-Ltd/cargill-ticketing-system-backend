export const MESSAGES = {
  healthCheck: {
    statusCode: 200,
    statusFlag: true,
    messageText: "server running successful !",
  },
  internalServerError: {
    statusFlag: false,
    statusCode: 500,
    messageText: "Internal Server Error !",
  },
  unauthorized: {
    statusFlag: false,
    statusCode: 401,
    messageText: "Unauthorized Request !",
  },
  forbidden: {
    statusFlag: false,
    statusCode: 403,
    messageText: "Forbidden access !",
  },
};
