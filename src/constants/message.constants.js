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
  validationError: {
    statusFlag: false,
    statusCode: 422,
    messageText: "Validation failed. Please check the errors and try again.",
  },
  notFound: {
    statusFlag: false,
    statusCode: 404,
    messageText: "Resource not found.",
  },
};
