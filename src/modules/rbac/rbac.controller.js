import { getDepartmentStatsService, addUserService, toggleUserStatusService, getQueuesService, getUsersOverviewService, getGroupsService, addGroupService, assignQueuesToGroupService, assignGroupsToUserService, removeGroupsFromUserService, editUserService, getGroupDetailsService, removeQueuesFromGroupService, editGroupService, getUserDetailsService, assignQueuesToUserService, removeQueuesFromUserService, getUserGroupsService } from "./rbac.service.js";
import { MESSAGES } from "../../constants/message.constants.js";
import asyncWrapper from "../../utils/asyncWrapper.js";

/**
 * POST /api/v1/rbac/get-departments
 * Body: { departmentId? }  — omit for all departments.
 * Returns active departments with:
 *   departmentId, departmentCode, departmentName,
 *   superUserCount, userCount, groupCount
 */
export const getDepartments = asyncWrapper(async (req, res) => {
  const { departmentId } = req.body ?? {};
  const departments = await getDepartmentStatsService(departmentId);
  return res.sendResponse(MESSAGES.departmentsFetched, departments);
});

/**
 * POST /api/v1/rbac/get-users
 * Body (all optional):
 *   userId       — filter to single user
 *   departmentId — filter to one department's users
 * No body = all users
 */
// export const getDepartmentUsers = asyncWrapper(async (req, res) => {
//   const { userId, departmentId } = req.body ?? {};
//   const users = await getDepartmentUsersService({ userId, departmentId });
//   return res.sendResponse(MESSAGES.usersFetched, users);
// });

/**
 * POST /api/v1/rbac/add-user
 * Body: { roleCode, userName, email, phoneNo?, departmentId, reportsToUserId?, assignedGroupIds? }
 * assignedGroupIds — array of group IDs.
 */
export const addUser = asyncWrapper(async (req, res) => {
  const {
    roleCode,
    userName,
    email,
    phoneNo,
    departmentId,
    assignedGroupIds = [],  // all roles: accepted in body; SUPERUSER -> multiple, USER -> max 1
    assignedQueueIds = [],  // USER only → inserted into user_queue
  } = req.body ?? {};

  const createdBy = req.user?.userId || 1;

  const result = await addUserService({
    roleCode, userName, email, phoneNo, departmentId,
    assignedGroupIds, assignedQueueIds, createdBy,
  });

  if (result?.error === "EMAIL_EXISTS") return res.sendResponse(MESSAGES.userAlreadyExists);
  if (result?.error === "INVALID_ROLE") return res.sendResponse(MESSAGES.validationError);
  if (result?.error === "INVALID_QUEUES_FOR_USER") return res.sendResponse(MESSAGES.invalidQueuesForUser);
  if (result?.error === "SUPERUSER_REQUIRED_FOR_QUEUE_ASSIGN") return res.sendResponse(MESSAGES.validationError);

  return res.sendResponse(MESSAGES.userAdded, { userId: result.userId });
});

/**
 * POST /api/v1/rbac/toggle-user-status
 * Body: { userId: number, isActive: boolean }
 * isActive=true  → activate user
 * isActive=false → deactivate user
 */
export const toggleUserStatus = asyncWrapper(async (req, res) => {
  const { userId, isActive } = req.body ?? {};

  const updatedBy = req.user?.email || 1;

  const result = await toggleUserStatusService({ userId, isActive, updatedBy });

  if (!result) return res.sendResponse(MESSAGES.notFound);

  return res.sendResponse(MESSAGES.userStatusUpdated, result);
});


/**
 * POST /api/v1/rbac/get-queues
 * Body: { groupId?: number, departmentId?: number }
 * groupId takes precedence — returns queues in that group.
 * Otherwise, returns all queues in the department.
 */
export const getQueues = asyncWrapper(async (req, res) => {
  const { groupId, departmentId, userId } = req.body ?? {};

  const queues = await getQueuesService({ groupId, departmentId, userId });
  return res.sendResponse(MESSAGES.queuesFetched, queues);
});

/**
 * POST /api/v1/rbac/get-users
 * Query params: ?page=1&pageSize=10 (optional)
 * Body: { departmentId? } (optional)
 * Returns paginated users from all departments or filtered by departmentId.
 */
export const getUsers = asyncWrapper(async (req, res) => {
  const { departmentId } = req.body ?? {};

  const result = await getUsersOverviewService({ departmentId });
  return res.sendResponse(MESSAGES.usersFetched, result);
});


/**
 * POST /api/v1/rbac/get-groups
 * Query params: ?page=1&pageSize=10 (optional)
 * Body: { departmentId? } (optional)
 * Returns paginated groups with counts of users and queues.
 */
export const getGroups = asyncWrapper(async (req, res) => {
  const { departmentId } = req.body ?? {};

  const result = await getGroupsService({ departmentId });
  return res.sendResponse(MESSAGES.groupsFetched, result);
});

/**
 * POST /api/v1/rbac/add-group
 * Body: { groupName, groupDescription?, departmentId, assignedQueueIds? }
 */
export const addGroup = asyncWrapper(async (req, res) => {
  const {
    groupName,
    groupDescription,
    departmentId,
    assignedQueueIds = [],
  } = req.body ?? {};

  const createdBy = req.user?.userId || 1;

  const result = await addGroupService({
    groupName,
    groupDescription,
    departmentId,
    assignedQueueIds,
    createdBy,
  });

  if (result?.error === "GROUP_NAME_EXISTS") return res.sendResponse(MESSAGES.groupAlreadyExists);
  if (result?.error === "INVALID_DEPARTMENT") return res.sendResponse(MESSAGES.invalidDepartment);
  if (result?.error === "INVALID_QUEUES") return res.sendResponse(MESSAGES.invalidQueues);

  return res.sendResponse(MESSAGES.groupAdded, { groupId: result.groupId });
});

/**
 * POST /api/v1/rbac/add-queues-to-group
 * Body: { groupId: number, queueIds: number[] }
 */
export const addQueuesToGroup = asyncWrapper(async (req, res) => {
  const { groupId, queueIds = [] } = req.body ?? {};

  const createdBy = req.user?.userId || 1;

  const result = await assignQueuesToGroupService({ groupId, queueIds, createdBy });

  if (result?.error === "GROUP_NOT_FOUND") return res.sendResponse(MESSAGES.groupNotFound);
  if (result?.error === "INVALID_QUEUES") return res.sendResponse(MESSAGES.invalidQueues);

  return res.sendResponse(MESSAGES.queuesAddedToGroup, { inserted: result.inserted });
});

/**
 * POST /api/v1/rbac/assign-group-to-user
 * Body: { userId: number, groupIds: number[] }
 * Adds the selected groups to the user. Existing assignments are left intact.
 */
export const assignGroupsToUser = asyncWrapper(async (req, res) => {
  const { userId, groupIds = [] } = req.body ?? {};

  const assignedBy = req.user?.userId || 1;
  const result = await assignGroupsToUserService({ userId, groupIds, assignedBy });

  if (result?.error === "USER_NOT_FOUND") return res.sendResponse(MESSAGES.userNotFound);
  if (result?.error === "NOT_SUPERUSER") return res.sendResponse(MESSAGES.notSuperuser);
  if (result?.error === "INVALID_GROUPS") return res.sendResponse(MESSAGES.invalidGroups);

  return res.sendResponse(MESSAGES.groupsAssignedToUser, { inserted: result.inserted });
});

/**
 * POST /api/v1/rbac/edit-user
 * Body (all optional except userId):
 *   userId         : number  (required)
 *   userName       : string
 *   roleCode       : string  — "USER" | "SUPERUSER"
 *   phoneNo        : string
 *   workLocation   : string
 * Only fields present in the body are updated.
 * Role change: ONLY role_id changes — hierarchy and groups untouched.
 */
export const editUser = asyncWrapper(async (req, res) => {
  const {
    userId,
    userName,
    roleCode,
    phoneNo,
    workLocation,
  } = req.body ?? {};

  const updatedBy = req.user?.userId || 1;

  const result = await editUserService({
    userId,
    userName,
    roleCode,
    phoneNo,
    workLocation,
    updatedBy,
  });

  if (result?.error === "USER_NOT_FOUND") return res.sendResponse(MESSAGES.userNotFound);
  if (result?.error === "INVALID_ROLE")   return res.sendResponse(MESSAGES.validationError);
  if (result?.error === "NO_CHANGES")     return res.sendResponse(MESSAGES.validationError);

  return res.sendResponse(MESSAGES.userUpdated, { userId: result.userId });
});

/**
 * POST /api/v1/rbac/get-group-details
 * Body: { groupIds: number[] }  — array of group IDs.
 * Returns per group: groupId, groupName, groupDescription,
 *   totalAssignedUsers (direct only), queues: [{ queueId, queueName }]
 */
export const getGroupDetails = asyncWrapper(async (req, res) => {
  const { groupIds } = req.body ?? {};

  const result = await getGroupDetailsService({ groupIds });
  return res.sendResponse(MESSAGES.groupDetailsFetched, result);
});

/**
 * POST /api/v1/rbac/remove-queues-from-group
 * Body: { groupId: number, queueIds: number[] }
 * Hard-deletes queue assignments from the given group.
 */
export const removeQueuesFromGroup = asyncWrapper(async (req, res) => {
  const { groupId, queueIds } = req.body ?? {};

  const result = await removeQueuesFromGroupService({ groupId, queueIds });

  if (result?.error === "GROUP_NOT_FOUND") {
    return res.sendResponse(MESSAGES.groupNotFound);
  }

  return res.sendResponse(MESSAGES.queuesRemovedFromGroup, { deleted: result.deleted });
});

/**
 * POST /api/v1/rbac/edit-group
 * Body: { groupId: number, groupName?: string, groupDescription?: string }
 * Edits group name and description.
 */
export const editGroup = asyncWrapper(async (req, res) => {
  const { groupId, groupName, groupDescription } = req.body ?? {};

  const updatedBy = req.user?.userId || 1;

  const result = await editGroupService({
    groupId,
    groupName,
    groupDescription,
    updatedBy,
  });

  if (result?.error === "GROUP_NOT_FOUND") return res.sendResponse(MESSAGES.groupNotFound);
  if (result?.error === "GROUP_NAME_EXISTS") return res.sendResponse(MESSAGES.groupAlreadyExists);
  if (result?.error === "NO_CHANGES") return res.sendResponse(MESSAGES.validationError);

  return res.sendResponse(MESSAGES.groupUpdated, { groupId: result.groupId });
});

/**
 * POST /api/v1/rbac/get-user-details
 * Body: { userId: number }
 * Returns profile info, inherited groups with queues count, and direct reports.
 */
export const getUserDetails = asyncWrapper(async (req, res) => {
  const { userId } = req.body ?? {};

  const result = await getUserDetailsService(userId);

  if (!result) {
    return res.sendResponse(MESSAGES.userNotFound);
  }

  return res.sendResponse(MESSAGES.userDetailsFetched, result);
});

/**
 * POST /api/v1/rbac/remove-groups-from-user
 * Body: { userId: number, groupIds: number[] }
 * Hard-deletes group assignments from the given user.
 */
export const removeGroupsFromUser = asyncWrapper(async (req, res) => {
  const { userId, groupIds } = req.body ?? {};

  const result = await removeGroupsFromUserService({ userId, groupIds });

  if (result?.error === "USER_NOT_FOUND") {
    return res.sendResponse(MESSAGES.userNotFound);
  }

  return res.sendResponse(MESSAGES.groupsRemovedFromUser, { deleted: result.deleted });
});

/**
 * POST /api/v1/rbac/assign-queues-to-user
 * Body: { userId: number, queueIds: number[] }
 * Assigns specific queues (from Superuser's pool) directly to a regular USER.
 * Only callable by Global Admin.
 */
export const assignQueuesToUser = asyncWrapper(async (req, res) => {
  const { userId, queueIds = [] } = req.body ?? {};

  const assignedBy = req.user?.userId || 1;
  const result = await assignQueuesToUserService({ userId, queueIds, assignedBy });

  if (result?.error === "USER_NOT_FOUND") return res.sendResponse(MESSAGES.userNotFound);
  if (result?.error === "NOT_REGULAR_USER") return res.sendResponse(MESSAGES.validationError);
  if (result?.error === "SUPERUSER_REQUIRED_FOR_QUEUE_ASSIGN") return res.sendResponse(MESSAGES.validationError);
  if (result?.error === "INVALID_QUEUES_FOR_USER") return res.sendResponse(MESSAGES.invalidQueuesForUser);

  return res.sendResponse(MESSAGES.queuesAssignedToUser, { inserted: result.inserted });
});

/**
 * POST /api/v1/rbac/remove-queues-from-user
 * Body: { userId: number, queueIds: number[] }
 * Removes direct queue assignments from a user.
 */
export const removeQueuesFromUser = asyncWrapper(async (req, res) => {
  const { userId, queueIds } = req.body ?? {};

  const result = await removeQueuesFromUserService({ userId, queueIds });

  if (result?.error === "USER_NOT_FOUND") {
    return res.sendResponse(MESSAGES.userNotFound);
  }

  return res.sendResponse(MESSAGES.queuesRemovedFromUser, { deleted: result.deleted });
});

/**
 * POST /api/v1/rbac/get-user-groups
 * Body: { userId: number }
 * Fetch all groups assigned to a specific user (superuser).
 */
export const getUserGroups = asyncWrapper(async (req, res) => {
  const { userId } = req.body ?? {};
  const result = await getUserGroupsService({ userId });
  return res.sendResponse(MESSAGES.groupsFetched, result);
});
