import { getUserByEmailService } from "./auth.service.js";
import { MESSAGES } from "../../constants/message.constants.js";
import asyncWrapper from "../../utils/asyncWrapper.js";

/**
 * POST /api/v1/auth/verify-access
 *
 * Called once by the frontend after SSO login.
 * Reads email from MSAL/Azure AD JWT (set by authenticateJwt middleware).
 * Looks up user in rbac.app_user — returns profile or 403 if not found/inactive.
 *
 * No body params required. Email comes from JWT payload (req.user.email).
 */
export const verifyUserAccess = asyncWrapper(async (req, res) => {
  const email = req.body.email;

  const user = await getUserByEmailService(email);

  if (!user) {
    return res.sendResponse(MESSAGES.forbidden);
  }

  return res.sendResponse(MESSAGES.accessVerified, user);
});
