import getPool from "../../config/db.js";
import { getConfig } from "../../config/env.config.js";

/**
 * Fetches all active departments with aggregated stats:
 *   - superUserCount : active users with role SUPERUSER in this dept
 *   - userCount      : active users with role USER in this dept
 *   - groupCount     : active groups belonging to this dept
 *
 * Single query — role table joined once, role_code used in CASE WHEN.
 * Schema name is from env — safe to interpolate (not user input).
 *
 * @param {number|null} departmentId  Optional — filters to a single dept.
 * @returns {Promise<object[]>}
 */
export const getDepartmentStatsModel = async (departmentId = null) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const query = `
    SELECT
      d.department_id   AS "departmentId",
      d.department_code AS "departmentCode",
      d.department_name AS "departmentName",
      d.department_desciption AS "departmentDescription",

      -- Active SUPERUSERs in this department
      COUNT(DISTINCT CASE
        WHEN r.role_code = 'SUPERUSER' AND u.is_active = TRUE
        THEN u.user_id
      END) AS "superUserCount",

      -- Active USERs in this department
      COUNT(DISTINCT CASE
        WHEN r.role_code = 'USER' AND u.is_active = TRUE
        THEN u.user_id
      END) AS "userCount",

      -- Active groups belonging to this department
      COUNT(DISTINCT g.group_id) AS "groupCount"

    FROM ${rbacSchema}.department d
    LEFT JOIN ${rbacSchema}.app_user u ON u.department_id = d.department_id
    LEFT JOIN ${rbacSchema}.role     r ON r.role_id       = u.role_id
    LEFT JOIN ${rbacSchema}.groups   g
      ON  g.department_id = d.department_id
      AND g.is_active     = TRUE
    ${departmentId ? `WHERE d.department_id = $1` : ""}
    GROUP BY d.department_id, d.department_code, d.department_name
    ORDER BY d.department_name
  `;

  const result = await pool.query(query, departmentId ? [departmentId] : []);
  return result.rows;
};

/**
 * Fetches user list with optional filters.
 * Filters: userId, departmentId — both optional.
 * No filters = all users returned.
 *
 * Returns per-user: name, email, role, department,
 *                   queuesAssigned (COUNT), isActive, lastLogin.
 *
 * @param {{ userId?: number, departmentId?: number }} filters
 * @returns {Promise<object[]>}
 */
// export const getDepartmentUsersModel = async ({ userId, departmentId } = {}) => {
//   const pool = getPool();
//   const { rbacSchema } = getConfig();

//   const conditions = ["1=1"];
//   const params = [];
//   let idx = 1;

//   if (userId) {
//     conditions.push(`u.user_id = $${idx++}`);
//     params.push(userId);
//   }

//   if (departmentId) {
//     conditions.push(`u.department_id = $${idx++}`);
//     params.push(departmentId);
//   }

//   const whereClause = conditions.join(" AND ");

//   const query = `
//     SELECT
//       -- Common fields
//       u.user_id                                    AS "userId",
//       u.user_name                                  AS "userName",
//       u.email,
//       r.role_code                                  AS "roleCode",
//       r.role_name                                  AS "roleName",
//       d.department_id                              AS "departmentId",
//       d.department_name                            AS "departmentName",
//       u.is_active                                  AS "isActive",
//       u.last_login_at                              AS "lastLogin",

//       -- DEPARTMENT_ADMIN specific
//       u.phone_no                                   AS phone,
//       u.work_location                              AS "workLocation",
//       u.created_at                                 AS "createdAt",

//       -- Supervisors directly under this user (DEPT_ADMIN)
//       (
//         SELECT COUNT(*)
//         FROM ${rbacSchema}.app_user sub
//         INNER JOIN ${rbacSchema}.role sr ON sr.role_id = sub.role_id
//         WHERE sub.reports_to_user_id = u.user_id
//           AND sr.role_code = 'SUPERVISOR'
//           AND sub.is_active = TRUE
//       ) AS "supervisorsUnder",

//       -- All active users (role=USER) in same department (DEPT_ADMIN)
//       (
//         SELECT COUNT(*)
//         FROM ${rbacSchema}.app_user sub
//         INNER JOIN ${rbacSchema}.role sr ON sr.role_id = sub.role_id
//         WHERE sub.department_id = u.department_id
//           AND sr.role_code = 'USER'
//           AND sub.is_active = TRUE
//       ) AS "usersUnder",

//       -- All queues in this department (DEPT_ADMIN)
//       (
//         SELECT COUNT(*)
//         FROM ${rbacSchema}.queue q
//         WHERE q.department_id = u.department_id
//           AND q.is_active = TRUE
//       ) AS "queuesUnder",

//       -- SUPERVISOR specific: direct report user count
//       (
//         SELECT COUNT(*)
//         FROM ${rbacSchema}.app_user sub
//         WHERE sub.reports_to_user_id = u.user_id
//           AND sub.is_active = TRUE
//       ) AS "usersAssigned",

//       -- SUPERVISOR specific: distinct queues from direct reports
//       (
//         SELECT COUNT(DISTINCT subuq.queue_id)
//         FROM ${rbacSchema}.app_user sub
//         INNER JOIN ${rbacSchema}.user_queue subuq ON subuq.user_id = sub.user_id
//         WHERE sub.reports_to_user_id = u.user_id
//       ) AS "queuesManaged",

//       -- USER specific: queues directly assigned
//       COUNT(uq.queue_id)                           AS "queuesAssigned",

//       -- USER specific: their supervisor name
//       (
//         SELECT sup.user_name
//         FROM ${rbacSchema}.app_user sup
//         WHERE sup.user_id = u.reports_to_user_id
//           AND sup.is_active = TRUE
//         LIMIT 1
//       ) AS "supervisorName"

//     FROM ${rbacSchema}.app_user u
//     INNER JOIN ${rbacSchema}.role r        ON r.role_id       = u.role_id
//     INNER JOIN ${rbacSchema}.department d  ON d.department_id = u.department_id
//     LEFT  JOIN ${rbacSchema}.user_queue uq ON uq.user_id      = u.user_id
//     WHERE ${whereClause}
//     GROUP BY
//       u.user_id, u.user_name, u.email,
//       r.role_code, r.role_name,
//       d.department_id, d.department_name,
//       u.is_active, u.last_login_at,
//       u.phone_no, u.work_location, u.created_at
//     ORDER BY u.user_name
//   `;

//   const result = await pool.query(query, params);
//   return result.rows;
// };

export const addUserModel = async ({ roleCode, userName, email, phoneNo, departmentId, reportsToUserId, assignedGroupIds = [], createdBy }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Email uniqueness check
    const emailCheck = await client.query(
      `SELECT user_id FROM ${rbacSchema}.app_user WHERE email = $1 LIMIT 1`,
      [email]
    );
    if (emailCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return { error: "EMAIL_EXISTS" };
    }

    // 2. Resolve role_id from roleCode
    const roleResult = await client.query(
      `SELECT role_id FROM ${rbacSchema}.role WHERE role_code = $1 LIMIT 1`,
      [roleCode]
    );
    if (!roleResult.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "INVALID_ROLE" };
    }
    const roleId = roleResult.rows[0].role_id;

    // 3. Insert user — RETURNING user_id for group assignment
    const insertResult = await client.query(
      `INSERT INTO ${rbacSchema}.app_user
         (user_name, email, phone_no, role_id, department_id, reports_to_user_id, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, CURRENT_TIMESTAMP)
       RETURNING user_id`,
      [userName, email, phoneNo ?? null, roleId, departmentId, reportsToUserId ?? null, createdBy]
    );
    const userId = insertResult.rows[0].user_id;

    // 4. Group assignment — if any group IDs provided
    if (assignedGroupIds.length > 0) {
      // jsonb_to_recordset: pass array of {group_id} objects as JSONB
      const groupsJson = JSON.stringify(
        assignedGroupIds.map((id) => ({ group_id: id }))
      );

      await client.query(
        `INSERT INTO ${rbacSchema}.user_group (user_id, group_id, assigned_by, assigned_at)
         SELECT $1, g.group_id, $2, CURRENT_TIMESTAMP
         FROM jsonb_to_recordset($3::jsonb) AS g(group_id BIGINT)`,
        [userId, createdBy, groupsJson]
      );
    }

    await client.query("COMMIT");
    return { userId };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Toggles is_active for a user.
 * Returns { userId, isActive } on success, undefined if user not found.
 *
 * @param {{ userId: number, isActive: boolean, updatedBy: string }} params
 * @returns {Promise<{ userId: number, isActive: boolean } | undefined>}
 */
export const toggleUserStatusModel = async ({ userId, isActive, updatedBy }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const result = await pool.query(
    `UPDATE ${rbacSchema}.app_user
     SET    is_active  = $2,
            updated_by = $3,
            updated_at = CURRENT_TIMESTAMP
     WHERE  user_id   = $1
     RETURNING user_id AS "userId", is_active AS "isActive"`,
    [userId, isActive, updatedBy]
  );

  return result.rows[0]; // undefined if no row matched
};

/**
 * Changes department admin in a single transaction:
 *   1. Resolve DEPARTMENT_ADMIN + USER role IDs
 *   2. Promote newAdminId  → DEPARTMENT_ADMIN, reports_to = NULL
 *   3. Demote  oldAdminId  → USER,              reports_to = newAdminId
 *   4. Rewire all SUPERVISOR in dept who reported to oldAdmin → newAdminId
 *
 * @param {{ oldAdminId: number, newAdminId: number, departmentId: number, updatedBy: string }} params
 * @returns {Promise<{ newAdminId: number, oldAdminId: number } | { error: string }>}
 */
export const changeDepartmentAdminModel = async ({ oldAdminId, newAdminId, departmentId, updatedBy }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Resolve role IDs
    const roleResult = await client.query(
      `SELECT role_id, role_code
       FROM ${rbacSchema}.role
       WHERE role_code IN ('DEPARTMENT_ADMIN', 'USER')`,
    );
    const roleMap = Object.fromEntries(roleResult.rows.map((r) => [r.role_code, r.role_id]));
    const deptAdminRoleId = roleMap["DEPARTMENT_ADMIN"];
    const userRoleId = roleMap["USER"];

    // 2. Validate new admin exists in this dept
    const newAdminCheck = await client.query(
      `SELECT user_id FROM ${rbacSchema}.app_user
       WHERE user_id = $1 AND department_id = $2 LIMIT 1`,
      [newAdminId, departmentId]
    );
    if (!newAdminCheck.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "NEW_ADMIN_NOT_FOUND" };
    }

    // 3. Validate old admin exists in this dept
    if (oldAdminId) {
      const oldAdminCheck = await client.query(
        `SELECT user_id FROM ${rbacSchema}.app_user
         WHERE user_id = $1 AND department_id = $2 LIMIT 1`,
        [oldAdminId, departmentId]
      );
      if (!oldAdminCheck.rows[0]) {
        await client.query("ROLLBACK");
        return { error: "OLD_ADMIN_NOT_FOUND" };
      }

      // 4. Demote old admin → USER, reports to new admin
      await client.query(
        `UPDATE ${rbacSchema}.app_user
         SET    role_id             = $1,
                reports_to_user_id  = $2,
                updated_by          = $3,
                updated_at          = CURRENT_TIMESTAMP
         WHERE  user_id             = $4`,
        [userRoleId, newAdminId, updatedBy, oldAdminId]
      );

      // 5. Rewire supervisors who reported to old admin → point to new admin
      await client.query(
        `UPDATE ${rbacSchema}.app_user
         SET    reports_to_user_id = $1,
                updated_by         = $2,
                updated_at         = CURRENT_TIMESTAMP
         WHERE  department_id      = $3
           AND  reports_to_user_id = $4`,
        [newAdminId, updatedBy, departmentId, oldAdminId]
      );
    }

    // 6. Promote new admin → DEPARTMENT_ADMIN, reports_to = NULL
    await client.query(
      `UPDATE ${rbacSchema}.app_user
       SET    role_id             = $1,
              reports_to_user_id  = NULL,
              updated_by          = $2,
              updated_at          = CURRENT_TIMESTAMP
       WHERE  user_id             = $3`,
      [deptAdminRoleId, updatedBy, newAdminId]
    );

    await client.query("COMMIT");
    return { newAdminId, oldAdminId };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Fetches active queues assigned to a group or, when no group is supplied,
 * all active queues in a department.
 *
 * @param {{ groupId?: number, departmentId?: number }} params
 * @returns {Promise<{ queueId: number, queueName: string }[]>}
 */
export const getQueuesModel = async ({ groupId, departmentId }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  if (groupId) {
    const result = await pool.query(
      `SELECT q.queue_id   AS "queueId",
              q.queue_name AS "queueName"
       FROM   ${rbacSchema}.group_queue gq
       JOIN   ${rbacSchema}.groups g
              ON g.group_id = gq.group_id
             AND g.is_active = TRUE
       JOIN   ${rbacSchema}.queue q
              ON q.queue_id = gq.queue_id
       WHERE  gq.group_id = $1
       ORDER  BY q.queue_name`,
      [groupId]
    );

    return result.rows;
  }

  const result = await pool.query(
    `SELECT queue_id   AS "queueId",
            queue_name AS "queueName"
     FROM   ${rbacSchema}.queue
     WHERE  department_id = $1
     ORDER  BY queue_name`,
    [departmentId]
  );

  return result.rows;
};

/**
 * Deletes a single user_queue assignment row.
 * Returns true if row deleted, false if not found.
 *
 * @param {{ userId: number, queueId: number }} params
 * @returns {Promise<boolean>}
 */
export const removeUserQueueModel = async ({ userId, queueId }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const result = await pool.query(
    `DELETE FROM ${rbacSchema}.user_queue
     WHERE user_id  = $1
       AND queue_id = $2`,
    [userId, queueId]
  );

  return result.rowCount > 0;
};

/**
 * Fetches paginated users for the overview table.
 * GLOBAL_ADMIN (department_id = NULL) is excluded via INNER JOIN on department.
 *
 * Per user:
 *   userId, userName, email, roleCode, roleName, departmentName,
 *   reportsToName, groupsAssigned (COUNT DISTINCT via user_group),
 *   isActive, lastLogin, totalCount (window fn — total rows before LIMIT).
 *
 * @param {{ departmentId?: number }} options
 * @returns {Promise<object[]>}
 */
export const getUsersOverviewModel = async ({ departmentId }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const query = `
    WITH base AS (
      SELECT
        u.user_id            AS "userId",
        u.user_name          AS "userName",
        u.email,
        u.phone_no           AS "phoneNo",
        u.work_location      AS "workLocation",
        r.role_code          AS "roleCode",
        r.role_name          AS "roleName",
        d.department_id      AS "departmentId",
        d.department_name    AS "departmentName",
        u.is_active          AS "isActive",
        u.last_login_at      AS "lastLogin",
        u.reports_to_user_id AS "reportsToUserId",

        -- SUPERUSER: own groups + reporting users' groups (DISTINCT)
        -- USER:       own groups only
        -- Role-gated so a demoted SUPERUSER loses inherited groups immediately.
        (
          SELECT COUNT(DISTINCT ug.group_id)
          FROM ${rbacSchema}.user_group ug
          JOIN ${rbacSchema}.app_user assigned_user
            ON assigned_user.user_id = ug.user_id
          WHERE
            assigned_user.user_id = u.user_id
            OR (
              r.role_code = 'SUPERUSER'
              AND assigned_user.reports_to_user_id = u.user_id
            )
        ) AS "groupsAssigned"

      FROM ${rbacSchema}.app_user u

      JOIN ${rbacSchema}.role r
        ON r.role_id = u.role_id

      JOIN ${rbacSchema}.department d
        ON d.department_id = u.department_id
      
      ${departmentId ? `WHERE u.department_id = $1` : ''}
    )

    SELECT
      b.*,

      -- Name of the user this person reports to
      (
        SELECT sup.user_name
        FROM ${rbacSchema}.app_user sup
        WHERE sup.user_id = b."reportsToUserId"
        LIMIT 1
      ) AS "reportsToUserName",

      -- Total records before pagination
      COUNT(*) OVER() AS "totalCount"

    FROM base b

    ORDER BY
      b."departmentName",
      b."roleCode",
      b."userName"
  `;

  const params = [];
  if (departmentId) {
    params.push(departmentId);
  }

  const result = await pool.query(query, params);

  return result.rows;
};


/**
 * Fetches all active departments with their supervisors.
 * LEFT JOIN on SUPERVISOR role — HR depts (no SUPERVISOR role in DB)
 * naturally return empty supervisors array. No app_type branching needed in SQL.
 *
 * Returns flat rows: one row per supervisor (or one NULL-supervisor row per dept if none).
 * Service groups them into { departmentId, departmentName, supervisors: [] }.
 *
 * @returns {Promise<object[]>}
 */
export const getDepartmentSupervisorsModel = async () => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const query = `
    SELECT
      d.department_id   AS "departmentId",
      d.department_name AS "departmentName",
      sup.user_id       AS "supervisorId",
      sup.user_name     AS "supervisorName"

    FROM   ${rbacSchema}.department d

    -- Subquery isolates SUPERVISOR users only — LEFT JOIN ensures dept always shows
    LEFT   JOIN (
      SELECT au.user_id, au.user_name, au.department_id
      FROM   ${rbacSchema}.app_user au
      JOIN   ${rbacSchema}.role r
             ON  r.role_id   = au.role_id
             AND r.role_code = 'SUPERVISOR'
      WHERE  au.is_active = TRUE
    ) sup ON sup.department_id = d.department_id

    WHERE  d.is_active = TRUE

    ORDER  BY d.department_name, sup.user_name
  `;

  const result = await pool.query(query);
  return result.rows;
};

/**
 * Fetches paginated groups for the Groups overview table.
 * 
 * Per group:
 *   groupId, groupName, groupDescription, departmentName,
 *   queuesAssigned (COUNT DISTINCT via group_queue),
 *   usersAssigned (COUNT DISTINCT via user_group),
 *   totalCount (window fn — total rows before LIMIT).
 *
 * @param {{ departmentId?: number }} options
 * @returns {Promise<object[]>}
 */
export const getGroupsModel = async ({ departmentId }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const query = `
    WITH base AS (
      SELECT
        g.group_id                AS "groupId",
        g.group_name              AS "groupName",
        g.group_description       AS "groupDescription",
        g.department_id           AS "departmentId",
        d.department_name         AS "departmentName",

        -- Count of queues assigned to this group
        COUNT(DISTINCT gq.queue_id) AS "queuesAssigned",

        -- Count of users assigned to this group
        COUNT(DISTINCT ug.user_id)  AS "usersAssigned"

      FROM ${rbacSchema}.groups g
      JOIN ${rbacSchema}.department d ON d.department_id = g.department_id
      LEFT JOIN ${rbacSchema}.group_queue gq ON gq.group_id = g.group_id
      LEFT JOIN ${rbacSchema}.user_group ug ON ug.group_id = g.group_id
      WHERE g.is_active = TRUE
      ${departmentId ? 'AND g.department_id = $1' : ''}
      GROUP BY
        g.group_id, g.group_name, g.group_description, g.department_id, d.department_name
    )
    SELECT 
      b.*,
      COUNT(*) OVER() AS "totalCount"
    FROM base b
    ORDER BY b."departmentName", b."groupName"
  `;

  const params = [];
  if (departmentId) {
    params.push(departmentId);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Creates a new group and optionally assigns queues via group_queue.
 * Validates group name uniqueness, department existence, and queue-department match.
 *
 * @param {{ groupName: string, groupDescription?: string, departmentId: number, assignedQueueIds?: number[], createdBy: number }} params
 * @returns {Promise<{ groupId: number } | { error: string }>}
 */
export const addGroupModel = async ({ groupName, groupDescription, departmentId, assignedQueueIds = [], createdBy }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const nameCheck = await client.query(
      `SELECT group_id
       FROM ${rbacSchema}.groups
       WHERE LOWER(TRIM(group_name)) = LOWER(TRIM($1))
       LIMIT 1`,
      [groupName]
    );
    if (nameCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return { error: "GROUP_NAME_EXISTS" };
    }

    const deptCheck = await client.query(
      `SELECT department_id
       FROM ${rbacSchema}.department
       WHERE department_id = $1 LIMIT 1`,
      [departmentId]
    );
    if (!deptCheck.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "INVALID_DEPARTMENT" };
    }

    if (assignedQueueIds.length > 0) {
      const queueCheck = await client.query(
        `SELECT queue_id
         FROM ${rbacSchema}.queue
         WHERE queue_id = ANY($1::bigint[])
           AND department_id = $2`,
        [assignedQueueIds, departmentId]
      );
      if (queueCheck.rows.length !== assignedQueueIds.length) {
        await client.query("ROLLBACK");
        return { error: "INVALID_QUEUES" };
      }
    }

    const insertResult = await client.query(
      `INSERT INTO ${rbacSchema}.groups
         (group_name, group_description, department_id, is_active, created_by, created_at)
       VALUES ($1, $2, $3, TRUE, $4, CURRENT_TIMESTAMP)
       RETURNING group_id`,
      [groupName.trim(), groupDescription?.trim() ?? null, departmentId, createdBy]
    );
    const groupId = insertResult.rows[0].group_id;

    if (assignedQueueIds.length > 0) {
      const queuesJson = JSON.stringify(
        assignedQueueIds.map((id) => ({ queue_id: id }))
      );

      await client.query(
        `INSERT INTO ${rbacSchema}.group_queue (group_id, queue_id, created_by, created_at)
         SELECT $1, q.queue_id, $2, CURRENT_TIMESTAMP
         FROM jsonb_to_recordset($3::jsonb) AS q(queue_id BIGINT)
         ON CONFLICT (group_id, queue_id) DO NOTHING`,
        [groupId, createdBy, queuesJson]
      );
    }

    await client.query("COMMIT");
    return { groupId };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Assigns queues to an existing group via group_queue.
 * Validates group existence and queue-department match.
 *
 * @param {{ groupId: number, queueIds: number[], createdBy: number }} params
 * @returns {Promise<{ inserted: number } | { error: string }>}
 */
export const assignQueuesToGroupModel = async ({ groupId, queueIds, createdBy }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const groupResult = await pool.query(
    `SELECT group_id, department_id
     FROM ${rbacSchema}.groups
     WHERE group_id = $1 AND is_active = TRUE
     LIMIT 1`,
    [groupId]
  );
  if (!groupResult.rows[0]) {
    return { error: "GROUP_NOT_FOUND" };
  }

  const { department_id: departmentId } = groupResult.rows[0];

  const queueCheck = await pool.query(
    `SELECT queue_id
     FROM ${rbacSchema}.queue
     WHERE queue_id = ANY($1::bigint[])
       AND department_id = $2`,
    [queueIds, departmentId]
  );
  if (queueCheck.rows.length !== queueIds.length) {
    return { error: "INVALID_QUEUES" };
  }

  const queuesJson = JSON.stringify(queueIds.map((id) => ({ queue_id: id })));

  const result = await pool.query(
    `INSERT INTO ${rbacSchema}.group_queue (group_id, queue_id, created_by, created_at)
     SELECT $1, q.queue_id, $2, CURRENT_TIMESTAMP
     FROM jsonb_to_recordset($3::jsonb) AS q(queue_id BIGINT)
     ON CONFLICT (group_id, queue_id) DO NOTHING`,
    [groupId, createdBy, queuesJson]
  );

  return { inserted: result.rowCount };
};

/**
 * Adds group assignments for a user and their direct superuser through user_group.
 * Validates that all groups are active and belong to the user's department.
 * Existing assignments are not duplicated.
 *
 * @param {{ userId: number, groupIds: number[], assignedBy: number }} params
 * @returns {Promise<{ inserted: number } | { error: string }>}
 */
export const assignGroupsToUserModel = async ({ userId, groupIds, assignedBy }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT user_id, department_id, reports_to_user_id
       FROM ${rbacSchema}.app_user
       WHERE user_id = $1
         AND is_active = TRUE
       LIMIT 1`,
      [userId]
    );
    const user = userResult.rows[0];
    if (!user) {
      await client.query("ROLLBACK");
      return { error: "USER_NOT_FOUND" };
    }

    const groupsResult = await client.query(
      `SELECT group_id
       FROM ${rbacSchema}.groups
       WHERE group_id = ANY($1::bigint[])
         AND department_id = $2
         AND is_active = TRUE`,
      [groupIds, user.department_id]
    );
    if (groupsResult.rows.length !== groupIds.length) {
      await client.query("ROLLBACK");
      return { error: "INVALID_GROUPS" };
    }

    const result = await client.query(
      `INSERT INTO ${rbacSchema}.user_group (user_id, group_id, assigned_by, assigned_at)
       SELECT $1, selected.group_id, $2, CURRENT_TIMESTAMP
       FROM unnest($3::bigint[]) AS selected(group_id)
       ON CONFLICT (user_id, group_id) DO NOTHING`,
      [user.user_id, assignedBy, groupIds]
    );

    await client.query("COMMIT");
    return { inserted: result.rowCount };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Removes group assignments for a user.
 * Validates user exists. Deletes matching rows from user_group.
 *
 * @param {{ userId: number, groupIds: number[] }} params
 * @returns {Promise<{ deleted: number } | { error: string }>}
 */
export const removeGroupsFromUserModel = async ({ userId, groupIds }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const userResult = await pool.query(
    `SELECT user_id FROM ${rbacSchema}.app_user WHERE user_id = $1 AND is_active = TRUE LIMIT 1`,
    [userId]
  );
  if (!userResult.rows[0]) return { error: "USER_NOT_FOUND" };

  const result = await pool.query(
    `DELETE FROM ${rbacSchema}.user_group
     WHERE user_id = $1
       AND group_id = ANY($2::bigint[])`,
    [userId, groupIds]
  );

  return { deleted: result.rowCount };
};

/**
 * Partially updates a user record.
 * Only fields present (not undefined) in the payload are updated.
 *
 * Editable fields: userName, roleCode, phoneNo, reportsToUserId, workLocation.
 * NOT editable:    email, departmentId (UI greys them out).
 *
 * Role change (SUPERUSER ↔ USER):
 *   - Only role_id changes.
 *   - reports_to_user_id is left intact (per spec — hierarchy independent of role).
 *   - People reporting TO this user are NOT reassigned (per spec).
 *   - Groups are NOT touched.
 *
 * @param {{ userId: number, userName?, roleCode?, phoneNo?, reportsToUserId?, workLocation?, updatedBy: number }} params
 * @returns {Promise<{ userId: number } | { error: string }>}
 */
export const editUserModel = async ({ userId, userName, roleCode, phoneNo, reportsToUserId, workLocation, updatedBy }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verify user exists
    const userCheck = await client.query(
      `SELECT user_id FROM ${rbacSchema}.app_user WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (!userCheck.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "USER_NOT_FOUND" };
    }

    // 2. Resolve role_id if roleCode is being changed
    let roleId;
    if (roleCode !== undefined) {
      const roleResult = await client.query(
        `SELECT role_id FROM ${rbacSchema}.role WHERE role_code = $1 LIMIT 1`,
        [roleCode]
      );
      if (!roleResult.rows[0]) {
        await client.query("ROLLBACK");
        return { error: "INVALID_ROLE" };
      }
      roleId = roleResult.rows[0].role_id;
    }

    // 3. Build dynamic SET clause — only include fields that were actually sent
    const setClauses = [];
    const params = [];
    let idx = 1;

    if (userName !== undefined) {
      setClauses.push(`user_name = $${idx++}`);
      params.push(userName.trim());
    }
    if (roleId !== undefined) {
      setClauses.push(`role_id = $${idx++}`);
      params.push(roleId);
    }
    if (phoneNo !== undefined) {
      setClauses.push(`phone_no = $${idx++}`);
      params.push(phoneNo);
    }
    if (reportsToUserId !== undefined) {
      setClauses.push(`reports_to_user_id = $${idx++}`);
      params.push(reportsToUserId);
    }
    if (workLocation !== undefined) {
      setClauses.push(`work_location = $${idx++}`);
      params.push(workLocation);
    }

    if (setClauses.length === 0) {
      await client.query("ROLLBACK");
      return { error: "NO_CHANGES" };
    }

    // Always stamp audit fields
    setClauses.push(`updated_by = $${idx++}`);
    params.push(updatedBy);
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    // 4. Execute update
    params.push(userId);
    const result = await client.query(
      `UPDATE ${rbacSchema}.app_user
       SET    ${setClauses.join(", ")}
       WHERE  user_id = $${idx}
       RETURNING user_id AS "userId"`,
      params
    );

    await client.query("COMMIT");
    return { userId: result.rows[0].userId };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Fetches details for one or more groups by ID array.
 *
 * Returns flat rows: one row per (group, queue) pair.
 * If group has no queues, returns one row with NULL queue fields.
 * Service reshapes into nested { group + queues[] }.
 *
 * totalAssignedUsers = direct user_group assignments ONLY (no inheritance).
 *
 * @param {{ groupIds: number[] }} params
 * @returns {Promise<object[]>}
 */
export const getGroupDetailsModel = async ({ groupIds }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const result = await pool.query(
    `SELECT
       g.group_id                              AS "groupId",
       g.group_name                            AS "groupName",
       g.group_description                     AS "groupDescription",

       -- Direct assignments only — no inheritance
       COUNT(DISTINCT ug.user_id)              AS "totalAssignedUsers",

       q.queue_id                              AS "queueId",
       q.queue_name                            AS "queueName"

     FROM   ${rbacSchema}.groups g

     -- Direct user assignments (no role-based inheritance here)
     LEFT JOIN ${rbacSchema}.user_group  ug ON ug.group_id  = g.group_id

     -- Queues in this group
     LEFT JOIN ${rbacSchema}.group_queue gq ON gq.group_id  = g.group_id
     LEFT JOIN ${rbacSchema}.queue       q  ON q.queue_id   = gq.queue_id

     WHERE  g.group_id  = ANY($1::bigint[])
       AND  g.is_active = TRUE

     GROUP BY
       g.group_id,
       g.group_name,
       g.group_description,
       q.queue_id,
       q.queue_name

     ORDER BY g.group_name, q.queue_name`,
    [groupIds]
  );

  return result.rows;
};

/**
 * Hard-deletes queue assignments from a group.
 * Validates group exists before deleting.
 *
 * @param {{ groupId: number, queueIds: number[] }} params
 * @returns {Promise<{ deleted: number } | { error: string }>}
 */
export const removeQueuesFromGroupModel = async ({ groupId, queueIds }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  // Validate group exists
  const groupCheck = await pool.query(
    `SELECT group_id FROM ${rbacSchema}.groups WHERE group_id = $1 AND is_active = TRUE LIMIT 1`,
    [groupId]
  );
  if (!groupCheck.rows[0]) {
    return { error: "GROUP_NOT_FOUND" };
  }

  const result = await pool.query(
    `DELETE FROM ${rbacSchema}.group_queue
     WHERE  group_id  = $1
       AND  queue_id  = ANY($2::bigint[])`,
    [groupId, queueIds]
  );

  return { deleted: result.rowCount };
};

/**
 * Partially updates a group record.
 * Only fields present in the payload are updated.
 * Editable fields: groupName, groupDescription.
 *
 * @param {{ groupId: number, groupName?: string, groupDescription?: string, updatedBy: number }} params
 * @returns {Promise<{ groupId: number } | { error: string }>}
 */
export const editGroupModel = async ({ groupId, groupName, groupDescription, updatedBy }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verify group exists
    const groupCheck = await client.query(
      `SELECT group_id FROM ${rbacSchema}.groups WHERE group_id = $1 AND is_active = TRUE LIMIT 1`,
      [groupId]
    );
    if (!groupCheck.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "GROUP_NOT_FOUND" };
    }

    // 2. Validate group name uniqueness if groupName is provided
    if (groupName !== undefined) {
      const nameCheck = await client.query(
        `SELECT group_id FROM ${rbacSchema}.groups WHERE group_name = $1 AND group_id != $2 LIMIT 1`,
        [groupName.trim(), groupId]
      );
      if (nameCheck.rows[0]) {
        await client.query("ROLLBACK");
        return { error: "GROUP_NAME_EXISTS" };
      }
    }

    // 3. Build dynamic SET clause
    const setClauses = [];
    const params = [];
    let idx = 1;

    if (groupName !== undefined) {
      setClauses.push(`group_name = $${idx++}`);
      params.push(groupName.trim());
    }
    if (groupDescription !== undefined) {
      setClauses.push(`group_description = $${idx++}`);
      params.push(groupDescription);
    }

    if (setClauses.length === 0) {
      await client.query("ROLLBACK");
      return { error: "NO_CHANGES" };
    }

    // Audit fields
    setClauses.push(`updated_by = $${idx++}`);
    params.push(updatedBy);
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    // 4. Execute update
    params.push(groupId);
    const result = await client.query(
      `UPDATE ${rbacSchema}.groups
       SET    ${setClauses.join(", ")}
       WHERE  group_id = $${idx}
       RETURNING group_id AS "groupId"`,
      params
    );

    await client.query("COMMIT");
    return { groupId: result.rows[0].groupId };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Fetches detailed profile of a single user (Super User view).
 * Returns:
 * 1. userInfo: profile details
 * 2. inheritedGroups: direct groups + inherited groups (if SUPERUSER) with queue counts
 * 3. directReports: users who report to this user
 *
 * @param {number} userId
 * @returns {Promise<object | null>}
 */
export const getUserDetailsModel = async (userId) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  // 1. User Info
  const userQuery = `
    SELECT
      u.user_id AS "userId", u.user_name AS "userName", u.email, u.phone_no AS "phoneNo",
      u.work_location AS "workLocation", u.created_at AS "createdAt", u.is_active AS "isActive",
      r.role_code AS "roleCode", r.role_name AS "roleName",
      d.department_id AS "departmentId",
      d.department_name AS "departmentName"
    FROM ${rbacSchema}.app_user u
    JOIN ${rbacSchema}.role r ON r.role_id = u.role_id
    JOIN ${rbacSchema}.department d ON d.department_id = u.department_id
    WHERE u.user_id = $1
  `;
  const userRes = await pool.query(userQuery, [userId]);
  if (!userRes.rows[0]) return null;

  const userInfo = userRes.rows[0];

  // 2. Groups (Direct + Inherited if SUPERUSER)
  const groupsQuery = `
    WITH user_groups AS (
      -- Direct groups
      SELECT group_id FROM ${rbacSchema}.user_group WHERE user_id = $1
      UNION
      -- Inherited groups (only if user is SUPERUSER)
      SELECT ug.group_id
      FROM ${rbacSchema}.user_group ug
      JOIN ${rbacSchema}.app_user sub ON sub.user_id = ug.user_id
      JOIN ${rbacSchema}.app_user u ON u.user_id = $1
      JOIN ${rbacSchema}.role r ON r.role_id = u.role_id
      WHERE sub.reports_to_user_id = $1
        AND r.role_code = 'SUPERUSER'
    )
    SELECT
      g.group_id AS "groupId",
      g.group_name AS "groupName",
      COUNT(DISTINCT gq.queue_id) AS "queuesCount"
    FROM user_groups ug
    JOIN ${rbacSchema}.groups g ON g.group_id = ug.group_id
    LEFT JOIN ${rbacSchema}.group_queue gq ON gq.group_id = g.group_id
    WHERE g.is_active = TRUE
    GROUP BY g.group_id, g.group_name
    ORDER BY g.group_name
  `;
  const groupsRes = await pool.query(groupsQuery, [userId]);

  // 3. Direct Reports
  const reportsQuery = `
    SELECT
      u.user_id AS "userId",
      u.user_name AS "userName",
      u.email,
      r.role_name AS "roleName"
    FROM ${rbacSchema}.app_user u
    JOIN ${rbacSchema}.role r ON r.role_id = u.role_id
    WHERE u.reports_to_user_id = $1
      AND u.is_active = TRUE
    ORDER BY u.user_name
  `;
  const reportsRes = await pool.query(reportsQuery, [userId]);

  return {
    userInfo,
    inheritedGroups: groupsRes.rows.map(g => ({ ...g, queuesCount: Number(g.queuesCount) })),
    directReports: reportsRes.rows
  };
};
