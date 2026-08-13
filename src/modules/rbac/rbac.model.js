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
export const getDepartmentUsersModel = async ({ userId, departmentId } = {}) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const conditions = ["1=1"];
  const params = [];
  let idx = 1;

  if (userId) {
    conditions.push(`u.user_id = $${idx++}`);
    params.push(userId);
  }

  if (departmentId) {
    conditions.push(`u.department_id = $${idx++}`);
    params.push(departmentId);
  }

  const whereClause = conditions.join(" AND ");

  const query = `
    SELECT
      -- Common fields
      u.user_id                                    AS "userId",
      u.user_name                                  AS "userName",
      u.email,
      r.role_code                                  AS "roleCode",
      r.role_name                                  AS "roleName",
      d.department_id                              AS "departmentId",
      d.department_name                            AS "departmentName",
      u.is_active                                  AS "isActive",
      u.last_login_at                              AS "lastLogin",

      -- DEPARTMENT_ADMIN specific
      u.phone_no                                   AS phone,
      u.work_location                              AS "workLocation",
      u.created_at                                 AS "createdAt",

      -- Supervisors directly under this user (DEPT_ADMIN)
      (
        SELECT COUNT(*)
        FROM ${rbacSchema}.app_user sub
        INNER JOIN ${rbacSchema}.role sr ON sr.role_id = sub.role_id
        WHERE sub.reports_to_user_id = u.user_id
          AND sr.role_code = 'SUPERVISOR'
          AND sub.is_active = TRUE
      ) AS "supervisorsUnder",

      -- All active users (role=USER) in same department (DEPT_ADMIN)
      (
        SELECT COUNT(*)
        FROM ${rbacSchema}.app_user sub
        INNER JOIN ${rbacSchema}.role sr ON sr.role_id = sub.role_id
        WHERE sub.department_id = u.department_id
          AND sr.role_code = 'USER'
          AND sub.is_active = TRUE
      ) AS "usersUnder",

      -- All queues in this department (DEPT_ADMIN)
      (
        SELECT COUNT(*)
        FROM ${rbacSchema}.queue q
        WHERE q.department_id = u.department_id
          AND q.is_active = TRUE
      ) AS "queuesUnder",

      -- SUPERVISOR specific: direct report user count
      (
        SELECT COUNT(*)
        FROM ${rbacSchema}.app_user sub
        WHERE sub.reports_to_user_id = u.user_id
          AND sub.is_active = TRUE
      ) AS "usersAssigned",

      -- SUPERVISOR specific: distinct queues from direct reports
      (
        SELECT COUNT(DISTINCT subuq.queue_id)
        FROM ${rbacSchema}.app_user sub
        INNER JOIN ${rbacSchema}.user_queue subuq ON subuq.user_id = sub.user_id
        WHERE sub.reports_to_user_id = u.user_id
      ) AS "queuesManaged",

      -- USER specific: queues directly assigned
      COUNT(uq.queue_id)                           AS "queuesAssigned",

      -- USER specific: their supervisor name
      (
        SELECT sup.user_name
        FROM ${rbacSchema}.app_user sup
        WHERE sup.user_id = u.reports_to_user_id
          AND sup.is_active = TRUE
        LIMIT 1
      ) AS "supervisorName"

    FROM ${rbacSchema}.app_user u
    INNER JOIN ${rbacSchema}.role r        ON r.role_id       = u.role_id
    INNER JOIN ${rbacSchema}.department d  ON d.department_id = u.department_id
    LEFT  JOIN ${rbacSchema}.user_queue uq ON uq.user_id      = u.user_id
    WHERE ${whereClause}
    GROUP BY
      u.user_id, u.user_name, u.email,
      r.role_code, r.role_name,
      d.department_id, d.department_name,
      u.is_active, u.last_login_at,
      u.phone_no, u.work_location, u.created_at
    ORDER BY u.user_name
  `;

  const result = await pool.query(query, params);
  return result.rows;
};

export const addUserModel = async ({ roleCode, userName, email, departmentId, reportsToUserId, assignedQueueIds = [], createdBy }) => {
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

    // 2. Department Admin uniqueness check — only one active DEPT_ADMIN per department
    if (roleCode === "DEPARTMENT_ADMIN") {
      const adminCheck = await client.query(
        `SELECT u.user_id
         FROM ${rbacSchema}.app_user u
         INNER JOIN ${rbacSchema}.role r ON r.role_id = u.role_id
         WHERE u.department_id = $1
           AND r.role_code     = 'DEPARTMENT_ADMIN'
           AND u.is_active     = TRUE
         LIMIT 1`,
        [departmentId]
      );
      if (adminCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return { error: "DEPT_ADMIN_EXISTS" };
      }
    }

    // 3. Resolve role_id from roleCode
    const roleResult = await client.query(
      `SELECT role_id FROM ${rbacSchema}.role WHERE role_code = $1 LIMIT 1`,
      [roleCode]
    );
    if (!roleResult.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "INVALID_ROLE" };
    }
    const roleId = roleResult.rows[0].role_id;

    // 4. Insert user — RETURNING user_id for queue assignment
    const insertResult = await client.query(
      `INSERT INTO ${rbacSchema}.app_user
         (user_name, email, role_id, department_id, reports_to_user_id, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6, CURRENT_TIMESTAMP)
       RETURNING user_id`,
      [userName, email, roleId, departmentId, reportsToUserId ?? null, createdBy]
    );
    const userId = insertResult.rows[0].user_id;

    // 5. Queue assignment — only for USER role, only if queue IDs provided
    if (roleCode === "USER" && assignedQueueIds.length > 0) {
      // jsonb_to_recordset: pass array of {queue_id} objects as JSONB
      const queuesJson = JSON.stringify(
        assignedQueueIds.map((id) => ({ queue_id: id }))
      );

      await client.query(
        `INSERT INTO ${rbacSchema}.user_queue (user_id, queue_id, created_by, created_at)
         SELECT $1, q.queue_id, $2, CURRENT_TIMESTAMP
         FROM jsonb_to_recordset($3::jsonb) AS q(queue_id BIGINT)`,
        [userId, createdBy, queuesJson]
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
 * Fetches queues by userId OR departmentId.
 * userId      → queues assigned to that user via user_queue
 * departmentId → all active queues in that department
 *
 * @param {{ userId?: number, departmentId?: number }} params
 * @returns {Promise<{ queueId: number, queueName: string }[]>}
 */
export const getQueuesModel = async ({ userId, departmentId }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  if (userId) {
    const result = await pool.query(
      `SELECT q.queue_id   AS "queueId",
              q.queue_name AS "queueName"
       FROM   ${rbacSchema}.user_queue uq
       JOIN   ${rbacSchema}.queue      q  ON q.queue_id = uq.queue_id
       WHERE  uq.user_id = $1
         AND  q.is_active = TRUE
       ORDER  BY q.queue_name`,
      [userId]
    );
    return result.rows;
  }

  if (departmentId) {
    const result = await pool.query(
      `SELECT queue_id   AS "queueId",
              queue_name AS "queueName"
       FROM   ${rbacSchema}.queue
       WHERE  department_id = $1
         AND  is_active     = TRUE
       ORDER  BY queue_name`,
      [departmentId]
    );
    return result.rows;
  }

  return [];
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
 * Bulk-assigns queues to a user via jsonb_to_recordset — single INSERT, no loop.
 * Skips duplicates with ON CONFLICT DO NOTHING.
 *
 * @param {{ userId: number, queueIds: number[], createdBy: string }} params
 * @returns {Promise<number>} rowCount — number of rows actually inserted
 */
export const assignQueuesModel = async ({ userId, queueIds, createdBy }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const queuesJson = JSON.stringify(queueIds.map((id) => ({ queue_id: id })));

  const result = await pool.query(
    `INSERT INTO ${rbacSchema}.user_queue (user_id, queue_id, created_by, created_at)
     SELECT $1, q.queue_id, $2, CURRENT_TIMESTAMP
     FROM   jsonb_to_recordset($3::jsonb) AS q(queue_id BIGINT)
     ON CONFLICT (user_id, queue_id) DO NOTHING`,
    [userId, createdBy, queuesJson]
  );

  return result.rowCount;
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
 * @param {{ limit: number, offset: number, departmentId?: number }} options
 * @returns {Promise<object[]>}
 */
export const getUsersOverviewModel = async ({ limit, offset, departmentId }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const query = `
    WITH base AS (
      SELECT
        u.user_id            AS "userId",
        u.user_name          AS "userName",
        u.email,
        r.role_code          AS "roleCode",
        r.role_name          AS "roleName",
        d.department_name    AS "departmentName",
        u.is_active          AS "isActive",
        u.last_login_at      AS "lastLogin",
        u.reports_to_user_id AS "reportsToUserId",

        -- Count UNIQUE groups assigned to this user
        -- and all users directly reporting to this user
        (
          SELECT COUNT(DISTINCT ug.group_id)
          FROM ${rbacSchema}.user_group ug
          JOIN ${rbacSchema}.app_user assigned_user
            ON assigned_user.user_id = ug.user_id
          WHERE
            assigned_user.user_id = u.user_id
            OR assigned_user.reports_to_user_id = u.user_id
        ) AS "groupsAssigned"

      FROM ${rbacSchema}.app_user u

      JOIN ${rbacSchema}.role r
        ON r.role_id = u.role_id

      JOIN ${rbacSchema}.department d
        ON d.department_id = u.department_id
      
      ${departmentId ? `WHERE u.department_id = $3` : ''}
    )

    SELECT
      b.*,

      -- Name of the user this person reports to
      (
        SELECT sup.user_name
        FROM ${rbacSchema}.app_user sup
        WHERE sup.user_id = b."reportsToUserId"
        LIMIT 1
      ) AS "reportsToName",

      -- Total records before pagination
      COUNT(*) OVER() AS "totalCount"

    FROM base b

    ORDER BY
      b."departmentName",
      b."roleCode",
      b."userName"

    LIMIT $1 OFFSET $2
  `;

  const params = [limit, offset];
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
 * @param {{ limit: number, offset: number, departmentId?: number }} options
 * @returns {Promise<object[]>}
 */
export const getGroupsModel = async ({ limit, offset, departmentId }) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();

  const query = `
    WITH base AS (
      SELECT
        g.group_id                AS "groupId",
        g.group_name              AS "groupName",
        g.group_description       AS "groupDescription",
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
      ${departmentId ? 'AND g.department_id = $3' : ''}
      GROUP BY
        g.group_id, g.group_name, g.group_description, d.department_name
    )
    SELECT 
      b.*,
      COUNT(*) OVER() AS "totalCount"
    FROM base b
    ORDER BY b."departmentName", b."groupName"
    LIMIT $1 OFFSET $2
  `;

  const params = [limit, offset];
  if (departmentId) {
    params.push(departmentId);
  }

  const result = await pool.query(query, params);
  return result.rows;
};