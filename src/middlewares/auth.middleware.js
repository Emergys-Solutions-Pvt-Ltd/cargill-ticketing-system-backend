import { CognitoJwtVerifier } from "aws-jwt-verify";
import { getConfig } from "../config/env.config.js";
import { MESSAGES } from "../constants/message.constants.js";

const config = getConfig();

// Verifier auto-caches JWKS and handles key rotation automatically
const verifier = CognitoJwtVerifier.create({
  userPoolId: config.cognito.userPoolId,
  tokenUse: "access", // Or "id", depends on Cognito setup
  clientId: config.cognito.clientId,
});

export const authenticateJwt = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.sendResponse(MESSAGES.unauthorized);
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = await verifier.verify(token);
    req.user = payload; // Attach user claims to request
    next();
  } catch (error) {
    console.error("JWT Verification failed:", error.message);
    return res.sendResponse(MESSAGES.unauthorized);
  }
};