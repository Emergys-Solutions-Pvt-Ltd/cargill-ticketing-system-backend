import express from "express";
import { getDepartments, addUser, toggleUserStatus, getQueues, getUsers, getGroups, addGroup, addQueuesToGroup, assignGroupsToUser, removeGroupsFromUser, editUser, getGroupDetails, removeQueuesFromGroup, editGroup, getUserDetails } from "./rbac.controller.js";
import { authenticateJwt } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getDepartmentsSchema, addUserSchema, toggleUserStatusSchema,
  getQueuesSchema, getUsersSchema, getGroupsSchema, addGroupSchema,
  addQueuesToGroupSchema, assignGroupsToUserSchema, editUserSchema, getGroupDetailsSchema,
  removeQueuesFromGroupSchema, editGroupSchema, getUserDetailsSchema, removeGroupsFromUserSchema
} from "./rbac.validation.js";

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
    validate(addGroupSchema),
    addGroup);

/**
 * POST /api/v1/rbac/get-departments
  * Body: { departmentId? }  — omit for all departments.
 * Protected. No body needed.
 * Returns all departments with admin name + stats.
 */
router.post("/get-departments",
    //  authenticateJwt,
    validate(getDepartmentsSchema),
    getDepartments);

// /**
//  * POST /api/v1/rbac/get-users
//  * Protected. Body: { userId?, departmentId? }
//  * All optional — no body = all users.
//  */
// router.post("/get-department-users",
//     // authenticateJwt,
//     validate(getDepartmentUsersSchema),
//     getDepartmentUsers);

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
    validate(addUserSchema),
    addUser);

/**
 * POST /api/v1/rbac/toggle-user-status
 * Protected. Body: { userId: number, isActive: boolean }
 */
router.post("/toggle-user-status",
    // authenticateJwt,
    validate(toggleUserStatusSchema),
    toggleUserStatus);

/**
 * POST /api/v1/rbac/get-queues
 * Body: { groupId?: number, departmentId?: number }
 * groupId takes precedence; otherwise departmentId is required.
 */
router.post("/get-queues",
    // authenticateJwt,
    validate(getQueuesSchema),
    getQueues);

/**
 * POST /api/v1/rbac/get-users
 * Body: { departmentId? } (optional)
 * All users across all/one department.
 */
router.post("/get-users",
    // authenticateJwt,
    validate(getUsersSchema),
    getUsers);

/**
 * POST /api/v1/rbac/get-groups
 * Protected. Body: { departmentId? }
 */
router.post("/get-groups",
    // authenticateJwt,
    validate(getGroupsSchema),
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
    validate(addQueuesToGroupSchema),
    addQueuesToGroup);

/**
 * POST /api/v1/rbac/assign-group-to-user
 * Body: { userId: number, groupIds: number[] }
 */
router.post("/assign-group-to-user",
    // authenticateJwt,
    validate(assignGroupsToUserSchema),
    assignGroupsToUser);

/**
 * POST /api/v1/rbac/edit-user
 * Body: { userId (required), userName?, roleCode?, phoneNo?, reportsToUserId?, workLocation? }
 * Partial update — only provided fields are changed.
 */
router.post("/edit-user",
    // authenticateJwt,
    validate(editUserSchema),
    editUser);

/**
 * POST /api/v1/rbac/get-group-details
 * Body: { groupIds: number[] }
 * Returns full group details with queues and direct user count.
 */
router.post("/get-group-details",
    // authenticateJwt,
    validate(getGroupDetailsSchema),
    getGroupDetails);

/**
 * POST /api/v1/rbac/remove-queues-from-group
 * Body: { groupId: number, queueIds: number[] }
 */
router.post("/remove-queues-from-group",
    // authenticateJwt,
    validate(removeQueuesFromGroupSchema),
    removeQueuesFromGroup);

/**
 * POST /api/v1/rbac/edit-group
 * Body: { groupId: number, groupName?: string, groupDescription?: string }
 */
router.post("/edit-group",
    // authenticateJwt,
    validate(editGroupSchema),
    editGroup);

/**
 * POST /api/v1/rbac/get-user-details
 * Body: { userId: number }
 */
router.post("/get-user-details",
    // authenticateJwt,
    validate(getUserDetailsSchema),
    getUserDetails);

/**
 * POST /api/v1/rbac/remove-groups-from-user
 * Body: { userId: number, groupIds: number[] }
 */
router.post("/remove-groups-from-user",
    // authenticateJwt,
    validate(removeGroupsFromUserSchema),
    removeGroupsFromUser);

export default router;