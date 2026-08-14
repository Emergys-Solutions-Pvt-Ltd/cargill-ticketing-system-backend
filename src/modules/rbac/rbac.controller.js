import { getDepartmentStatsService, getDepartmentUsersService, addUserService, toggleUserStatusService, changeDepartmentAdminService, getQueuesService, removeQueueService, assignQueuesService, getUsersOverviewService, getDepartmentSupervisorsService, getGroupsService, addGroupService, assignQueuesToGroupService } from "./rbac.service.js";
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
export const getDepartmentUsers = asyncWrapper(async (req, res) => {
  const { userId, departmentId } = req.body ?? {};
  const users = await getDepartmentUsersService({ userId, departmentId });
  return res.sendResponse(MESSAGES.usersFetched, users);
});

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
    reportsToUserId,
    assignedGroupIds = [],  // array of group IDs
  } = req.body ?? {};

  const createdBy = req.user?.userId || 1;

  const result = await addUserService({
    roleCode, userName, email, phoneNo, departmentId,
    reportsToUserId, assignedGroupIds, createdBy,
  });

  if (result?.error === "EMAIL_EXISTS") return res.sendResponse(MESSAGES.userAlreadyExists);
  if (result?.error === "INVALID_ROLE") return res.sendResponse(MESSAGES.validationError);

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

  const updatedBy = req.user?.email;

  const result = await toggleUserStatusService({ userId, isActive, updatedBy });

  if (!result) return res.sendResponse(MESSAGES.notFound);

  return res.sendResponse(MESSAGES.userStatusUpdated, result);
});

/**
 * POST /api/v1/rbac/change-department-admin
 * Body: { oldAdminId: number, newAdminId: number, departmentId: number }
 * oldAdminId optional — if dept currently has no admin.
 * Promotes newAdminId, demotes oldAdminId to USER, rewires supervisor reports_to.
 */
export const changeDeptAdmin = asyncWrapper(async (req, res) => {
  const { oldAdminId, newAdminId, departmentId } = req.body ?? {};

  const updatedBy = req.user?.email;

  const result = await changeDepartmentAdminService({ oldAdminId, newAdminId, departmentId, updatedBy });

  if (result?.error === "NEW_ADMIN_NOT_FOUND") return res.sendResponse(MESSAGES.newAdminNotFound);
  if (result?.error === "OLD_ADMIN_NOT_FOUND") return res.sendResponse(MESSAGES.oldAdminNotFound);

  return res.sendResponse(MESSAGES.adminChanged, result);
});

/**
 * POST /api/v1/rbac/get-queues
 * Body: { userId } → queues assigned to user
 *       { departmentId } → all active queues in dept
 */
export const getQueues = asyncWrapper(async (req, res) => {
  const { userId, departmentId } = req.body ?? {};
  const queues = await getQueuesService({ userId, departmentId });
  return res.sendResponse(MESSAGES.queuesFetched, queues);
});

/**
 * POST /api/v1/rbac/remove-queue
 * Body: { userId: number, queueId: number }
 * Deletes single user_queue row.
 */
export const removeQueue = asyncWrapper(async (req, res) => {
  const { userId, queueId } = req.body ?? {};
  const deleted = await removeQueueService({ userId, queueId });
  if (!deleted) return res.sendResponse(MESSAGES.notFound);
  return res.sendResponse(MESSAGES.queueRemoved);
});


/**
 * POST /api/v1/rbac/get-users
 * Query params: ?page=1&pageSize=10 (optional)
 * Body: { departmentId? } (optional)
 * Returns paginated users from all departments or filtered by departmentId.
 */
export const getUsers = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const { departmentId } = req.body ?? {};

  const result = await getUsersOverviewService({ page, pageSize, departmentId });
  return res.sendResponse(MESSAGES.usersFetched, result);
});

/**
 * GET /api/v1/rbac/get-department-supervisors
 * No body. Returns all departments with nested supervisors array.
 * GENERIC: supervisors populated. HR: supervisors = [] (no role in DB).
 */
export const getDepartmentSupervisors = asyncWrapper(async (req, res) => {
  const departments = await getDepartmentSupervisorsService();
  return res.sendResponse(MESSAGES.departmentSupervisorsFetched, departments);
});

/**
 * POST /api/v1/rbac/get-groups
 * Query params: ?page=1&pageSize=10 (optional)
 * Body: { departmentId? } (optional)
 * Returns paginated groups with counts of users and queues.
 */
export const getGroups = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const { departmentId } = req.body ?? {};

  const result = await getGroupsService({ page, pageSize, departmentId });
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

  if (!groupName?.trim() || !departmentId) {
    return res.sendResponse(MESSAGES.validationError);
  }

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

  if (!groupId || !Array.isArray(queueIds) || queueIds.length === 0) {
    return res.sendResponse(MESSAGES.validationError);
  }

  const createdBy = req.user?.userId || 1;

  const result = await assignQueuesToGroupService({ groupId, queueIds, createdBy });

  if (result?.error === "GROUP_NOT_FOUND") return res.sendResponse(MESSAGES.groupNotFound);
  if (result?.error === "INVALID_QUEUES") return res.sendResponse(MESSAGES.invalidQueues);

  return res.sendResponse(MESSAGES.queuesAddedToGroup, { inserted: result.inserted });
});

