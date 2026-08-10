import { getConfig } from "../../config/env.config.js";
import { getUserByEmailModel } from "./auth.model.js";

/**
 * Retrieves active user details by email.
 * Returns null if user not found or is inactive.
 *
 * @param {string} email - From Cognito JWT
 * @returns {Promise<object|null>}
 */
export const getUserByEmailService = async (email) => {
  const { appType } = getConfig();
  let user = await getUserByEmailModel(email);
  if (user) {
    user.appType = appType;
  }
  return user ?? null;
};
