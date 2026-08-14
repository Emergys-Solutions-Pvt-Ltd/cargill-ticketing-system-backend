import express from "express";
import { getDepartments, getDepartmentUsers, addUser, toggleUserStatus, changeDeptAdmin, getQueues, removeQueue, getUsers, getDepartmentSupervisors, getGroups, addGroup, addQueuesToGroup, assignGroupsToUser } from "./rbac.controller.js";
import { authenticateJwt } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/rbac/add-group
 * Protected. Body:
 * {
 *  groupName: string,
 *  groupDescription?: string,
 *  departmentId: number,
 *  assignedQueueIds?: number[],
 * }
 */
router.post("/add-group",
    // authenticateJwt,
    addGroup);

/**
 * POST /api/v1/rbac/get-departments
  * Body: { departmentId? }  — omit for all departments.
 * Protected. No body needed.
 * Returns all departments with admin name + stats.
 */
router.post("/get-departments",
    //  authenticateJwt,
    getDepartments);

/**
 * POST /api/v1/rbac/get-users
 * Protected. Body: { userId?, departmentId? }
 * All optional — no body = all users.
 */
router.post("/get-department-users",
    // authenticateJwt,
    getDepartmentUsers);

/**
 * POST /api/v1/rbac/add-user
 * Protected. Body:
 * {
 *  roleCode: string,
 *  userName: string,
 *  email: string,
 *  phoneNo?: string,
 *  departmentId: string,
 *  reportsToUserId?: number,
 *  assignedGroupIds?: number[],
 * }
 */
router.post("/add-user",
    // authenticateJwt,
    addUser);

/**
 * POST /api/v1/rbac/toggle-user-status
 * Protected. Body: { userId: number, isActive: boolean }
 */
router.post("/toggle-user-status",
    // authenticateJwt,
    toggleUserStatus);

/**
 * POST /api/v1/rbac/change-department-admin
 * Protected. Body: { oldAdminId?: number, newAdminId: number, departmentId: number }
 */
router.post("/change-department-admin",
    // authenticateJwt,
    changeDeptAdmin);

/**
 * POST /api/v1/rbac/get-queues
 * Body: { userId? } or { departmentId? }
 */
router.post("/get-queues",
    // authenticateJwt,
    getQueues);

/**
 * POST /api/v1/rbac/remove-queue
 * Body: { userId: number, queueId: number }
 */
router.post("/remove-queue",
    // authenticateJwt,
    removeQueue);

/**
 * POST /api/v1/rbac/get-users
 * Body: { departmentId? } (optional)
 * Query params: ?page=1&pageSize=10 (optional)
 * All users across all/one department, paginated.
 */
router.post("/get-users",
    // authenticateJwt,
    getUsers);

/**
 * GET /api/v1/rbac/get-department-supervisors
 * No body. All depts with supervisors. GENERIC: populated. HR: empty array.
 */
router.get("/get-department-supervisors",
    // authenticateJwt,
    getDepartmentSupervisors);

/**
 * POST /api/v1/rbac/get-groups
 * Protected. Body: { departmentId? }
 * Query params: ?page=1&pageSize=10
 */
router.post("/get-groups",
    // authenticateJwt,
    getGroups);

/**
 * POST /api/v1/rbac/add-queues-to-group
 * Protected. Body:
 * {
 *  groupId: number,
 *  queueIds: number[],
 * }
 */
router.post("/add-queues-to-group",
    // authenticateJwt,
    addQueuesToGroup);

/**
 * POST /api/v1/rbac/assign-group-to-user
 * Body: { userId: number, groupIds: number[] }
 */
router.post("/assign-group-to-user",
    // authenticateJwt,
    assignGroupsToUser);

export default router;
