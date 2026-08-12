import { getDepartmentStatsService, getDepartmentUsersService, addUserService, toggleUserStatusService, changeDepartmentAdminService, getQueuesService, removeQueueService, assignQueuesService, getUsersOverviewService, getDepartmentSupervisorsService } from "./rbac.service.js";
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
 * Body: { roleCode, userName, email, departmentId, reportsToUserId?, assignedQueueIds? }
 * assignedQueueIds — array of queue IDs, applied only for USER role.
 */
export const addUser = asyncWrapper(async (req, res) => {
  const {
    roleCode,
    userName,
    email,
    departmentId,
    reportsToUserId,
    assignedQueueIds = [],  // array of queue IDs
  } = req.body ?? {};

  const createdBy = req.user?.email;

  const result = await addUserService({
    roleCode, userName, email, departmentId,
    reportsToUserId, assignedQueueIds, createdBy,
  });

  if (result?.error === "EMAIL_EXISTS")     return res.sendResponse(MESSAGES.userAlreadyExists);
  if (result?.error === "DEPT_ADMIN_EXISTS") return res.sendResponse(MESSAGES.deptAdminAlreadyExists);
  if (result?.error === "INVALID_ROLE")     return res.sendResponse(MESSAGES.validationError);

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
 * POST /api/v1/rbac/assign-queues
 * Body: { userId: number, queueIds: number[] }
 * Bulk-inserts via jsonb_to_recordset. Skips duplicates.
 */
export const assignQueues = asyncWrapper(async (req, res) => {
  const { userId, queueIds = [] } = req.body ?? {};
  const createdBy = req.user?.email;
  const inserted = await assignQueuesService({ userId, queueIds, createdBy });
  return res.sendResponse(MESSAGES.queuesAssigned, { inserted });
});

/**
 * GET /api/v1/rbac/get-users
 * No body needed. Returns all users from all departments.
 * queuesAssigned smart-counted per role + APP_TYPE.
 */
export const getUsers = asyncWrapper(async (req, res) => {
  const users = await getUsersOverviewService();
  return res.sendResponse(MESSAGES.usersFetched, users);
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
