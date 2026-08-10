import express from "express";
import { getDepartments, getDepartmentUsers, addUser, toggleUserStatus, changeDeptAdmin, getQueues, removeQueue, assignQueues, getUsers, getDepartmentSupervisors } from "./rbac.controller.js";
import { authenticateJwt } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/rbac/get-departments
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
 * Protected. Body: {  }
 * @Body { 
 *  roleCode: string,
 *  userName: string,
 *  email: string,
 *  departmentId: string,
 *  reportsToUserId: number,
 *  assignedQueueId: number,
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
 * POST /api/v1/rbac/assign-queues
 * Body: { userId: number, queueIds: number[] }
 */
router.post("/assign-queues",
    // authenticateJwt,
    assignQueues);

/**
 * POST /api/v1/rbac/get-users-overview
 * No body. All users all departments, smart queue count per role.
 */
router.get("/get-users",
    // authenticateJwt,
    getUsers);

/**
 * GET /api/v1/rbac/get-department-supervisors
 * No body. All depts with supervisors. GENERIC: populated. HR: empty array.
 */
router.get("/get-department-supervisors",
    // authenticateJwt,
    getDepartmentSupervisors);

export default router;
