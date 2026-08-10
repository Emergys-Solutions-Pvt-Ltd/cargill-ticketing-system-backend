import getPool from "../../config/db.js";
import { getConfig } from "../../config/env.config.js";

/**
 * Fetches a single active user from rbac.app_user by email.
 * Returns undefined if not found or inactive.
 *
 * @param {string} email
 * @returns {Promise<object|undefined>}
 */
export const getUserByEmailModel = async (email) => {
  const pool = getPool();
  const { rbacSchema } = getConfig();
  const query = `
    SELECT au.user_id as "userId", au.user_name as "userName", r.role_code as "roleCode", r.role_name as "roleName", d.department_id as "departmentId",d.department_code as "departmentCode", d.department_name as "departmentName"
    FROM ${rbacSchema}.app_user au
    JOIN ${rbacSchema}.role r ON r.role_id = au.role_id
    LEFT JOIN ${rbacSchema}.department d ON d.department_id = au.department_id
    WHERE au.email     = $1
      AND au.is_active = TRUE
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0];
};
