import { CognitoJwtVerifier } from "aws-jwt-verify";
import { getConfig } from "../config/env.config.js";
import { MESSAGES } from "../constants/message.constants.js";
import logger from "../utils/logger.js";
import asyncWrapper from "../utils/asyncWrapper.js";

let verifier;

// Lazy-init: verifier created on first request, after loadConfig() has run
const getVerifier =  () => {
  if (!verifier) {
    const config = getConfig();
    // Verifier auto-caches JWKS and handles key rotation automatically
    verifier = CognitoJwtVerifier.create({
      userPoolId: config.cognito.userPoolId,
      tokenUse: "access", // Or "id", depends on Cognito setup
      clientId: config.cognito.clientId,
    });
  }
  return verifier;
}; 

export const authenticateJwt = asyncWrapper( async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.sendResponse(MESSAGES.unauthorized);
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = await getVerifier().verify(token);
    req.user = payload; // Attach user claims to request
    next();
  } catch (error) {
    logger.warn({ err: error }, "JWT verification failed");
    return res.sendResponse(MESSAGES.unauthorized);
  }
});