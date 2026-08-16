import { getDepartmentStatsModel, getDepartmentUsersModel, addUserModel, toggleUserStatusModel, getQueuesModel, getUsersOverviewModel, getGroupsModel, addGroupModel, assignQueuesToGroupModel, assignGroupsToUserModel, editUserModel, getGroupDetailsModel, removeQueuesFromGroupModel, editGroupModel, getUserDetailsModel } from "./rbac.model.js";
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
    departmentId: dept.departmentId,
    departmentCode: dept.departmentCode,
    departmentName: dept.departmentName,
    superUserCount: Number(dept.superUserCount),
    userCount: Number(dept.userCount),
    groupCount: Number(dept.groupCount),
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
 * Inserts a new user. Validates email uniqueness.
 * Assigns groups if provided.
 *
 * @param {{ roleCode, userName, email, phoneNo?, departmentId, reportsToUserId?, assignedGroupIds?, createdBy? }} data
 * @returns {Promise<{ userId: number } | { error: string }>}
 */
export const addUserService = async ({ roleCode, userName, email, phoneNo, departmentId, reportsToUserId, assignedGroupIds = [], createdBy }) => {
  return addUserModel({ roleCode, userName, email, phoneNo, departmentId, reportsToUserId, assignedGroupIds, createdBy });
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
 * Returns queues assigned to a group or, when no group is supplied, a department.
 * @param {{ groupId?: number, departmentId?: number }} params
 */
export const getQueuesService = async ({ groupId, departmentId }) => {
  return getQueuesModel({ groupId, departmentId });
};



/**
 * Returns paginated users for the overview table.
 * Unified response shape — no role-based branching, no APP_TYPE logic.
 *
 * @param {{ page?: number, pageSize?: number, departmentId?: number }} options
 * @returns {Promise<{ total: number, page: number, pageSize: number, users: object[] }>}
 */
export const getUsersOverviewService = async ({ page = 1, pageSize = 10, departmentId } = {}) => {
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const rows = await getUsersOverviewModel({ limit, offset, departmentId });

  const total = rows.length > 0 ? Number(rows[0].totalCount) : 0;

  const users = rows.map((u) => ({
    userId: u.userId,
    userName: u.userName,
    email: u.email,
    roleCode: u.roleCode,
    roleName: u.roleName,
    departmentName: u.departmentName,
    reportsToName: u.reportsToName ?? null,
    groupsAssigned: Number(u.groupsAssigned),
    isActive: u.isActive,
    lastLogin: u.lastLogin ?? null,
  }));

  return { total, page, pageSize, users };
};


/**
 * Returns paginated groups for the Groups overview table.
 *
 * @param {{ page?: number, pageSize?: number, departmentId?: number }} options
 * @returns {Promise<{ total: number, page: number, pageSize: number, groups: object[] }>}
 */
export const getGroupsService = async ({ page = 1, pageSize = 10, departmentId } = {}) => {
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const rows = await getGroupsModel({ limit, offset, departmentId });

  const total = rows.length > 0 ? Number(rows[0].totalCount) : 0;

  const groups = rows.map((g) => ({
    groupId: g.groupId,
    groupName: g.groupName,
    groupDescription: g.groupDescription ?? null,
    departmentName: g.departmentName,
    queuesAssigned: Number(g.queuesAssigned),
    usersAssigned: Number(g.usersAssigned)
  }));

  return { total, page, pageSize, groups };
};

/**
 * Creates a new group with optional queue assignments.
 *
 * @param {{ groupName: string, groupDescription?: string, departmentId: number, assignedQueueIds?: number[], createdBy: number }} data
 * @returns {Promise<{ groupId: number } | { error: string }>}
 */
export const addGroupService = async ({ groupName, groupDescription, departmentId, assignedQueueIds = [], createdBy }) => {
  const uniqueQueueIds = [...new Set(assignedQueueIds)];

  return addGroupModel({
    groupName,
    groupDescription,
    departmentId,
    assignedQueueIds: uniqueQueueIds,
    createdBy,
  });
};

/**
 * Assigns queues to an existing group. Skips already-assigned queues.
 *
 * @param {{ groupId: number, queueIds: number[], createdBy: number }} data
 * @returns {Promise<{ inserted: number } | { error: string }>}
 */
export const assignQueuesToGroupService = async ({ groupId, queueIds, createdBy }) => {
  const uniqueQueueIds = [...new Set(queueIds)];

  return assignQueuesToGroupModel({
    groupId,
    queueIds: uniqueQueueIds,
    createdBy,
  });
};

/**
 * Adds groups to an existing user. Every group must belong to the user's department.
 *
 * @param {{ userId: number, groupIds: number[], assignedBy: number }} data
 * @returns {Promise<{ inserted: number } | { error: string }>}
 */
export const assignGroupsToUserService = async ({ userId, groupIds, assignedBy }) => {
  const uniqueGroupIds = [...new Set(groupIds)];

  return assignGroupsToUserModel({
    userId,
    groupIds: uniqueGroupIds,
    assignedBy,
  });
};

/**
 * Partially updates a user.
 * Only fields present in payload are updated — undefined = skip.
 * Role change: only role_id updates. Hierarchy (reports_to) and groups unchanged.
 *
 * @param {{ userId: number, userName?, roleCode?, phoneNo?, reportsToUserId?, workLocation?, updatedBy: number }} data
 * @returns {Promise<{ userId: number } | { error: string }>}
 */
export const editUserService = async ({ userId, userName, roleCode, phoneNo, reportsToUserId, workLocation, updatedBy }) => {
  return editUserModel({ userId, userName, roleCode, phoneNo, reportsToUserId, workLocation, updatedBy });
};

/**
 * Returns full details for an array of groups:
 *   groupId, groupName, groupDescription, totalAssignedUsers (direct only),
 *   queues: [{ queueId, queueName }]
 *
 * @param {{ groupIds: number[] }} params
 * @returns {Promise<object[]>}
 */
export const getGroupDetailsService = async ({ groupIds }) => {
  const rows = await getGroupDetailsModel({ groupIds });

  // Reshape flat (group × queue) rows into nested { group + queues[] }
  const groupMap = new Map();

  rows.forEach((row) => {
    if (!groupMap.has(row.groupId)) {
      groupMap.set(row.groupId, {
        groupId:            row.groupId,
        groupName:          row.groupName,
        groupDescription:   row.groupDescription ?? null,
        totalAssignedUsers: Number(row.totalAssignedUsers),
        queues:             [],
      });
    }

    if (row.queueId !== null) {
      groupMap.get(row.groupId).queues.push({
        queueId:   row.queueId,
        queueName: row.queueName,
      });
    }
  });

  return Array.from(groupMap.values());
};

/**
 * Hard-deletes queue assignments from a group.
 * @param {{ groupId: number, queueIds: number[] }} params
 * @returns {Promise<{ deleted: number } | { error: string }>}
 */
export const removeQueuesFromGroupService = async ({ groupId, queueIds }) => {
  const uniqueQueueIds = [...new Set(queueIds)];
  return removeQueuesFromGroupModel({ groupId, queueIds: uniqueQueueIds });
};

/**
 * Edits group name and description.
 *
 * @param {{ groupId: number, groupName?: string, groupDescription?: string, updatedBy: number }} params
 * @returns {Promise<{ groupId: number } | { error: string }>}
 */
export const editGroupService = async ({ groupId, groupName, groupDescription, updatedBy }) => {
  return editGroupModel({ groupId, groupName, groupDescription, updatedBy });
};

/**
 * Gets full details for a single user including profile, inherited groups, and direct reports.
 * @param {number} userId
 */
export const getUserDetailsService = async (userId) => {
  return getUserDetailsModel(userId);
};
