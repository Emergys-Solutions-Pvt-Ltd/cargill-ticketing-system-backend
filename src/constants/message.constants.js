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
  ticketDetailsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Ticket details fetched successfully.",
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
  groupsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Groups fetched successfully.",
  },
  groupAdded: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Group created successfully.",
  },
  groupAlreadyExists: {
    statusFlag: false,
    statusCode: 409,
    messageText: "This group name is already in use. Please enter a different name.",
  },
  invalidDepartment: {
    statusFlag: false,
    statusCode: 404,
    messageText: "Department not found.",
  },
  invalidQueues: {
    statusFlag: false,
    statusCode: 422,
    messageText: "One or more queues are invalid or do not belong to the selected department.",
  },
  groupNotFound: {
    statusFlag: false,
    statusCode: 404,
    messageText: "Group not found.",
  },
  queuesAddedToGroup: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Queues added to group successfully.",
  },
  userNotFound: {
    statusFlag: false,
    statusCode: 404,
    messageText: "User not found or inactive.",
  },
  invalidGroups: {
    statusFlag: false,
    statusCode: 422,
    messageText: "One or more groups are invalid, inactive, or do not belong to the user's department.",
  },
  groupsAssignedToUser: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Groups assigned to user successfully.",
  },
  userUpdated: {
    statusFlag: true,
    statusCode: 200,
    messageText: "User updated successfully.",
  },
  groupDetailsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Group details fetched successfully.",
  },
  queuesRemovedFromGroup: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Queues removed from group successfully.",
  },
  groupUpdated: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Group updated successfully.",
  },
  userDetailsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "User details fetched successfully.",
  },
  groupsRemovedFromUser: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Groups removed from user successfully.",
  },
  queuesAssignedToUser: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Queues assigned to user successfully.",
  },
  queuesRemovedFromUser: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Queues removed from user successfully.",
  },
  invalidQueuesForUser: {
    statusFlag: false,
    statusCode: 422,
    messageText: "One or more queues are invalid or not accessible via the user's Superuser.",
  },
  notSuperuser: {
    statusFlag: false,
    statusCode: 422,
    messageText: "Groups can only be assigned to Superusers.",
  },
  ticketDetailsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Ticket details fetched successfully.",
  },
  filterOptionsFetched: {
    statusFlag: true,
    statusCode: 200,
    messageText: "Filter options fetched successfully.",
  },
};
