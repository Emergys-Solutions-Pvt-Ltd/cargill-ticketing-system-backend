import { getDepartmentStatsModel, getDepartmentUsersModel, addUserModel, toggleUserStatusModel, changeDepartmentAdminModel, getQueuesModel, removeUserQueueModel, assignQueuesModel, getUsersOverviewModel, getDepartmentSupervisorsModel, getGroupsModel } from "./rbac.model.js";
import { getConfig } from "../../config/env.config.js";

/**
 * Returns department list with aggregated stats for the new schema.
 * Per dept: superUserCount, userCount, groupCount.
 * All 3 counts are always returned — no APP_TYPE branching needed.
 *
 * @param {number|null} departmentId  Optional — filter to a single dept.
 * @returns {Promise<object[]>}
 */
export const getDepartmentStatsService = async (departmentId = null) => {
  const rows = await getDepartmentStatsModel(departmentId);

  return rows.map((dept) => ({
    departmentId:   dept.departmentId,
    departmentCode: dept.departmentCode,
    departmentName: dept.departmentName,
    superUserCount: Number(dept.superUserCount),
    userCount:      Number(dept.userCount),
    groupCount:     Number(dept.groupCount),
  }));
};

/**
 * Returns user list shaped per role.
 * DEPARTMENT_ADMIN → admin profile + dept stats
 * SUPERVISOR       → team management view
 * USER             → personal + supervisor + queues
 *
 * @param {{ userId?: number, departmentId?: number }} filters
 * @returns {Promise<object[]>}
 */
export const getDepartmentUsersService = async (filters = {}) => {
  const rows = await getDepartmentUsersModel(filters);

  return rows.map((u) => {
    switch (u.roleCode) {

      case "DEPARTMENT_ADMIN":
        return {
          userId: u.userId,
          userName: u.userName,
          phone: u.phone ?? null,
          email: u.email,
          workLocation: u.workLocation ?? null,
          createdAt: u.createdAt ?? null,
          supervisorsUnder: Number(u.supervisorsUnder),
          usersUnder: Number(u.usersUnder),
          queuesUnder: Number(u.queuesUnder),
          roleCode: u.roleCode,
          roleName: u.roleName,
          departmentId: u.departmentId,
          departmentName: u.departmentName,
        };

      case "SUPERVISOR":
        return {
          userId: u.userId,
          userName: u.userName,
          email: u.email,
          usersAssigned: Number(u.usersAssigned),
          queuesManaged: Number(u.queuesManaged),
          isActive: u.isActive,
          lastLogin: u.lastLogin ?? null,
          roleCode: u.roleCode,
          roleName: u.roleName,
          departmentId: u.departmentId,
          departmentName: u.departmentName,
        };

      default: // USER
        return {
          userId: u.userId,
          userName: u.userName,
          email: u.email,
          roleCode: u.roleCode,
          roleName: u.roleName,
          supervisorName: u.supervisorName ?? null,
          queuesAssigned: Number(u.queuesAssigned),
          isActive: u.isActive,
          lastLogin: u.lastLogin ?? null,
          departmentId: u.departmentId,
          departmentName: u.departmentName,
        };
    }
  });
};

/**
 * Inserts a new user. Validates email uniqueness and dept admin uniqueness.
 * Assigns queues via jsonb_to_recordset for USER role only.
 *
 * @param {{ roleCode, userName, email, departmentId, reportsToUserId?, assignedQueueIds?, createdBy? }} data
 * @returns {Promise<{ userId: number } | { error: string }>}
 */
export const addUserService = async ({ roleCode, userName, email, departmentId, reportsToUserId, assignedQueueIds = [], createdBy }) => {
  return addUserModel({ roleCode, userName, email, departmentId, reportsToUserId, assignedQueueIds, createdBy });
};

/**
 * Activates or deactivates a user.
 * Returns { userId, isActive } or null if userId not found.
 *
 * @param {{ userId: number, isActive: boolean, updatedBy: string }} params
 * @returns {Promise<{ userId: number, isActive: boolean } | null>}
 */
export const toggleUserStatusService = async ({ userId, isActive, updatedBy }) => {
  const row = await toggleUserStatusModel({ userId, isActive, updatedBy });
  return row ?? null; // null = user not found
};

/**
 * Changes department admin.
 * oldAdminId optional — if dept had no prior admin, pass null/undefined.
 *
 * @param {{ oldAdminId?: number, newAdminId: number, departmentId: number, updatedBy: string }} params
 * @returns {Promise<{ newAdminId: number, oldAdminId?: number } | { error: string }>}
 */
export const changeDepartmentAdminService = async ({ oldAdminId, newAdminId, departmentId, updatedBy }) => {
  return changeDepartmentAdminModel({ oldAdminId, newAdminId, departmentId, updatedBy });
};

/**
 * Returns queues by userId (assigned) or departmentId (all in dept).
 * @param {{ userId?: number, departmentId?: number }} params
 */
export const getQueuesService = async ({ userId, departmentId }) => {
  return getQueuesModel({ userId, departmentId });
};

/**
 * Removes single user_queue row.
 * Returns true if deleted, false if not found.
 * @param {{ userId: number, queueId: number }} params
 */
export const removeQueueService = async ({ userId, queueId }) => {
  return removeUserQueueModel({ userId, queueId });
};

/**
 * Bulk-assigns array of queue IDs to a user. Skips duplicates.
 * Returns count of newly inserted rows.
 * @param {{ userId: number, queueIds: number[], createdBy: string }} params
 */
export const assignQueuesService = async ({ userId, queueIds, createdBy }) => {
  return assignQueuesModel({ userId, queueIds, createdBy });
};

/**
 * Returns paginated users for the overview table.
 * Unified response shape — no role-based branching, no APP_TYPE logic.
 *
 * @param {{ page?: number, pageSize?: number, departmentId?: number }} options
 * @returns {Promise<{ total: number, page: number, pageSize: number, users: object[] }>}
 */
export const getUsersOverviewService = async ({ page = 1, pageSize = 10, departmentId } = {}) => {
  const limit  = pageSize;
  const offset = (page - 1) * pageSize;

  const rows = await getUsersOverviewModel({ limit, offset, departmentId });

  const total = rows.length > 0 ? Number(rows[0].totalCount) : 0;

  const users = rows.map((u) => ({
    userId:         u.userId,
    userName:       u.userName,
    email:          u.email,
    roleCode:       u.roleCode,
    roleName:       u.roleName,
    departmentName: u.departmentName,
    reportsToName:  u.reportsToName ?? null,
    groupsAssigned: Number(u.groupsAssigned),
    isActive:       u.isActive,
    lastLogin:      u.lastLogin ?? null,
  }));

  return { total, page, pageSize, users };
};

/**
 * Returns all active departments with their supervisors.
 * HR app_type: no SUPERVISOR role in DB → supervisors array empty naturally.
 * GENERIC: supervisors listed per department.
 *
 * @returns {Promise<object[]>}
 */
export const getDepartmentSupervisorsService = async () => {
  const rows = await getDepartmentSupervisorsModel();

  // Group flat rows into { departmentId, departmentName, supervisors: [] }
  const deptMap = new Map();

  rows.forEach((row) => {
    if (!deptMap.has(row.departmentId)) {
      deptMap.set(row.departmentId, {
        departmentId:   row.departmentId,
        departmentName: row.departmentName,
        supervisors:    [],
      });
    }

    if (row.supervisorId !== null) {
      deptMap.get(row.departmentId).supervisors.push({
        userId:   row.supervisorId,
        userName: row.supervisorName,
      });
    }
  });

  return Array.from(deptMap.values());
};

/**
 * Returns paginated groups for the Groups overview table.
 *
 * @param {{ page?: number, pageSize?: number, departmentId?: number }} options
 * @returns {Promise<{ total: number, page: number, pageSize: number, groups: object[] }>}
 */
export const getGroupsService = async ({ page = 1, pageSize = 10, departmentId } = {}) => {
  const limit  = pageSize;
  const offset = (page - 1) * pageSize;

  const rows = await getGroupsModel({ limit, offset, departmentId });

  const total = rows.length > 0 ? Number(rows[0].totalCount) : 0;

  const groups = rows.map((g) => ({
    groupId:          g.groupId,
    groupName:        g.groupName,
    groupDescription: g.groupDescription ?? null,
    departmentName:   g.departmentName,
    queuesAssigned:   Number(g.queuesAssigned),
    usersAssigned:    Number(g.usersAssigned)
  }));

  return { total, page, pageSize, groups };
};

