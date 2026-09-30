import express from "express";
import { getDepartments, addUser, toggleUserStatus, getQueues, getUsers, getGroups, addGroup, addQueuesToGroup, assignGroupsToUser, removeGroupsFromUser, editUser, getGroupDetails, removeQueuesFromGroup, editGroup, getUserDetails, assignQueuesToUser, removeQueuesFromUser, getUserGroups } from "./rbac.controller.js";
import { authenticateJwt } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getDepartmentsSchema, addUserSchema, toggleUserStatusSchema,
  getQueuesSchema, getUsersSchema, getGroupsSchema, addGroupSchema,
  addQueuesToGroupSchema, assignGroupsToUserSchema, editUserSchema, getGroupDetailsSchema,
  removeQueuesFromGroupSchema, editGroupSchema, getUserDetailsSchema, removeGroupsFromUserSchema,
  assignQueuesToUserSchema, removeQueuesFromUserSchema, getUserGroupsSchema
} from "./rbac.validation.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: RBAC
 *   description: Role-based access control — users, groups, queues, departments
 */

/**
 * POST /api/v1/rbac/add-group
 * Protected. Body:
 * {
 *  groupName: string,
 *  groupDescription?: string,
 *  departmentId: number,
 *  assignedQueueIds?: number[],
 * }
 *
 * @swagger
 * /rbac/add-group:
 *   post:
 *     summary: Create a new group
 *     tags: [RBAC]
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
 *
 * @swagger
 * /rbac/get-departments:
 *   post:
 *     summary: Get departments
 *     tags: [RBAC]
 */
router.post("/get-departments",
    //  authenticateJwt,
    validate(getDepartmentsSchema),
    getDepartments);

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
 *
 * @swagger
 * /rbac/add-user:
 *   post:
 *     summary: Add a new user
 *     tags: [RBAC]
 */
router.post("/add-user",
    // authenticateJwt,
    validate(addUserSchema),
    addUser);

/**
 * POST /api/v1/rbac/toggle-user-status
 * Protected. Body: { userId: number, isActive: boolean }
 *
 * @swagger
 * /rbac/toggle-user-status:
 *   post:
 *     summary: Activate or deactivate a user
 *     tags: [RBAC]
 */
router.post("/toggle-user-status",
    // authenticateJwt,
    validate(toggleUserStatusSchema),
    toggleUserStatus);

/**
 * POST /api/v1/rbac/get-queues
 * Body: { groupId?: number, departmentId?: number }
 * groupId takes precedence; otherwise departmentId is required.
 *
 * @swagger
 * /rbac/get-queues:
 *   post:
 *     summary: Get queues for a group or department
 *     tags: [RBAC]
 */
router.post("/get-queues",
    // authenticateJwt,
    validate(getQueuesSchema),
    getQueues);

/**
 * POST /api/v1/rbac/get-users
 * Body: { departmentId? } (optional)
 * All users across all/one department.
 *
 * @swagger
 * /rbac/get-users:
 *   post:
 *     summary: Get all users
 *     tags: [RBAC]
 */
router.post("/get-users",
    // authenticateJwt,
    validate(getUsersSchema),
    getUsers);

/**
 * POST /api/v1/rbac/get-groups
 * Protected. Body: { departmentId? }
 *
 * @swagger
 * /rbac/get-groups:
 *   post:
 *     summary: Get groups
 *     tags: [RBAC]
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
 *
 * @swagger
 * /rbac/add-queues-to-group:
 *   post:
 *     summary: Assign queues to a group
 *     tags: [RBAC]
 */
router.post("/add-queues-to-group",
    // authenticateJwt,
    validate(addQueuesToGroupSchema),
    addQueuesToGroup);

/**
 * POST /api/v1/rbac/assign-group-to-user
 * Body: { userId: number, groupIds: number[] }
 *
 * @swagger
 * /rbac/assign-group-to-user:
 *   post:
 *     summary: Assign groups to a user
 *     tags: [RBAC]
 */
router.post("/assign-group-to-user",
    // authenticateJwt,
    validate(assignGroupsToUserSchema),
    assignGroupsToUser);

/**
 * POST /api/v1/rbac/edit-user
 * Body: { userId (required), userName?, roleCode?, phoneNo?, reportsToUserId?, workLocation? }
 * Partial update — only provided fields are changed.
 *
 * @swagger
 * /rbac/edit-user:
 *   post:
 *     summary: Partially update a user
 *     tags: [RBAC]
 */
router.post("/edit-user",
    // authenticateJwt,
    validate(editUserSchema),
    editUser);

/**
 * POST /api/v1/rbac/get-group-details
 * Body: { groupIds: number[] }
 * Returns full group details with queues and direct user count.
 *
 * @swagger
 * /rbac/get-group-details:
 *   post:
 *     summary: Get full details for one or more groups
 *     tags: [RBAC]
 */
router.post("/get-group-details",
    // authenticateJwt,
    validate(getGroupDetailsSchema),
    getGroupDetails);

/**
 * POST /api/v1/rbac/remove-queues-from-group
 * Body: { groupId: number, queueIds: number[] }
 *
 * @swagger
 * /rbac/remove-queues-from-group:
 *   post:
 *     summary: Remove queues from a group
 *     tags: [RBAC]
 */
router.post("/remove-queues-from-group",
    // authenticateJwt,
    validate(removeQueuesFromGroupSchema),
    removeQueuesFromGroup);

/**
 * POST /api/v1/rbac/edit-group
 * Body: { groupId: number, groupName?: string, groupDescription?: string }
 *
 * @swagger
 * /rbac/edit-group:
 *   post:
 *     summary: Edit a group
 *     tags: [RBAC]
 */
router.post("/edit-group",
    // authenticateJwt,
    validate(editGroupSchema),
    editGroup);

/**
 * POST /api/v1/rbac/get-user-details
 * Body: { userId: number }
 *
 * @swagger
 * /rbac/get-user-details:
 *   post:
 *     summary: Get details for a specific user
 *     tags: [RBAC]
 */
router.post("/get-user-details",
    // authenticateJwt,
    validate(getUserDetailsSchema),
    getUserDetails);

/**
 * POST /api/v1/rbac/remove-groups-from-user
 * Body: { userId: number, groupIds: number[] }
 *
 * @swagger
 * /rbac/remove-groups-from-user:
 *   post:
 *     summary: Remove groups from a user
 *     tags: [RBAC]
 */
router.post("/remove-groups-from-user",
    // authenticateJwt,
    validate(removeGroupsFromUserSchema),
    removeGroupsFromUser);

/**
 * POST /api/v1/rbac/assign-queues-to-user
 * Body: { userId: number, queueIds: number[] }
 * Global Admin assigns specific queues (from Superuser's pool) to a regular USER.
 *
 * @swagger
 * /rbac/assign-queues-to-user:
 *   post:
 *     summary: Assign direct queues to a user
 *     tags: [RBAC]
 */
router.post("/assign-queues-to-user",
    // authenticateJwt,
    validate(assignQueuesToUserSchema),
    assignQueuesToUser);

/**
 * POST /api/v1/rbac/remove-queues-from-user
 * Body: { userId: number, queueIds: number[] }
 * Global Admin removes direct queue assignments from a USER.
 *
 * @swagger
 * /rbac/remove-queues-from-user:
 *   post:
 *     summary: Remove direct queue assignments from a user
 *     tags: [RBAC]
 */
router.post("/remove-queues-from-user",
    // authenticateJwt,
    validate(removeQueuesFromUserSchema),
    removeQueuesFromUser);

/**
 * POST /api/v1/rbac/get-user-groups
 * Body: { userId: number }
 * Fetch all groups assigned to a specific user (superuser).
 *
 * @swagger
 * /rbac/get-user-groups:
 *   post:
 *     summary: Get all groups assigned to a user
 *     tags: [RBAC]
 */
router.post("/get-user-groups",
    // authenticateJwt,
    validate(getUserGroupsSchema),
    getUserGroups);

export default router;