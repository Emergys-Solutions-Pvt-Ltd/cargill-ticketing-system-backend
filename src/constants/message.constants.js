export const MESSAGES = {
  healthCheck: {
    statusCode: 200,
    statusFlag: true,
    messageText: "server running successful !",
  },
  internalServerError: {
    statusFlag: false,
    statusCode: 500,
    messageText: "Internal Server Error",
  },
  unauthorized: {
    statusFlag: false,
    statusCode: 401,
    messageText: "Unauthorized Request",
  },
  forbidden: {
    statusFlag: false,
    statusCode: 403,
    messageText: "Forbidden access",
  },
  validationError: {
    statusFlag: false,
    statusCode: 422,
    messageText: "Validation failed. Please check the errors and try again.",
  },
  ticketsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Tickets fetched successfully.",
  },
  filterOptionsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Filter options fetched successfully.",
  },
  userDetailsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "User details fetched successfully.",
  },
  departmentsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Departments fetched successfully.",
  },
  usersFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Users fetched successfully.",
  },
  userAdded: {
    statusFlag: true,
    statusCode: 200,
    messageText: "User added successfully.",
  },
  userAlreadyExists: {
    statusFlag: false,
    statusCode: 409,
    messageText: "user already exists.",
  },
  deptAdminAlreadyExists: {
    statusFlag: false,
    statusCode: 409,
    messageText: "Department already has a Department Admin.",
  },
  notFound: {
    statusFlag: false,
    statusCode: 404,
    messageText: "Resource not found.",
  },
  accessVerified: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Access verified successfully",
  },
  userStatusUpdated: {
    statusFlag: true,
    statusCode: 200,
    messageText: "User status updated successfully.",
  },
  adminChanged: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Department admin changed successfully.",
  },
  newAdminNotFound: {
    statusFlag: false,
    statusCode: 404,
    messageText: "New admin user not found in this department.",
  },
  oldAdminNotFound: {
    statusFlag: false,
    statusCode: 404,
    messageText: "Old admin user not found in this department.",
  },
  queuesFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Queues fetched successfully.",
  },
  queueRemoved: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Queue removed successfully.",
  },
  queuesAssigned: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Queues assigned successfully.",
  },
  usersOverviewFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Users overview fetched successfully.",
  },
  departmentSupervisorsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Department supervisors fetched successfully.",
  },
};
