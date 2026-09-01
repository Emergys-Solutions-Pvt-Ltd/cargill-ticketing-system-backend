import Joi from "joi";

export const getDepartmentsSchema = Joi.object({
  departmentId: Joi.number().integer().positive().optional(),
});

export const getDepartmentUsersSchema = Joi.object({
  userId: Joi.number().integer().positive().optional(),
  departmentId: Joi.number().integer().positive().optional(),
});

export const addUserSchema = Joi.object({
  roleCode: Joi.string().valid("GLOBAL_ADMIN", "SUPERUSER", "USER").required(),
  userName: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  phoneNo: Joi.string().trim().optional().allow(""),
  departmentId: Joi.number().integer().positive().required(),
  reportsToUserId: Joi.number().integer().positive().optional(),
  // Accepted for all roles in body.
  // SUPERUSER → inserted into user_group.
  // USER      → accepted but not used (reserved for future).
  assignedGroupIds: Joi.array().items(Joi.number().integer().positive()).optional(),
  // USER only — assigned queues from Superuser's group pool.
  assignedQueueIds: Joi.array().items(Joi.number().integer().positive()).optional(),
});

export const toggleUserStatusSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  isActive: Joi.boolean().required(),
});

export const getQueuesSchema = Joi.object({
  groupId: Joi.array().items(Joi.number().integer().positive()).single().optional(),
  departmentId: Joi.number().integer().positive().optional(),
  userId: Joi.number().integer().positive().optional(),
}).or("groupId", "departmentId").messages({
  "object.missing": "Either groupId or departmentId is required",
});

export const getUsersSchema = Joi.object({
  departmentId: Joi.number().integer().positive().optional(),
});

export const getGroupsSchema = Joi.object({
  departmentId: Joi.number().integer().positive().optional(),
});



export const addGroupSchema = Joi.object({
  groupName: Joi.string().trim().required(),
  groupDescription: Joi.string().trim().optional().allow(""),
  departmentId: Joi.number().integer().positive().required(),
  assignedQueueIds: Joi.array().items(Joi.number().integer().positive()).optional(),
});

export const addQueuesToGroupSchema = Joi.object({
  groupId: Joi.number().integer().positive().required(),
  queueIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

export const assignGroupsToUserSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  groupIds: Joi.array().items(Joi.number().integer().positive()).required(),
});

export const editUserSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  userName: Joi.string().trim().optional(),
  roleCode: Joi.string().valid("GLOBAL_ADMIN", "SUPERUSER", "USER").optional(),
  phoneNo: Joi.string().trim().optional().allow(""),
  reportsToUserId: Joi.number().integer().positive().optional(),
  workLocation: Joi.string().trim().optional().allow(""),
}).min(2).messages({ // min 2 because userId is 1, needs at least one field to edit
  "object.min": "At least one field to update must be provided",
});

export const getGroupDetailsSchema = Joi.object({
  groupIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

export const removeQueuesFromGroupSchema = Joi.object({
  groupId: Joi.number().integer().positive().required(),
  queueIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

export const editGroupSchema = Joi.object({
  groupId: Joi.number().integer().positive().required(),
  groupName: Joi.string().trim().optional(),
  groupDescription: Joi.string().trim().optional().allow(""),
}).min(2).messages({
  "object.min": "At least one field (groupName or groupDescription) to update must be provided",
});

export const getUserDetailsSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
});

export const removeGroupsFromUserSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  groupIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

export const assignQueuesToUserSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  queueIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

export const removeQueuesFromUserSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  queueIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});
