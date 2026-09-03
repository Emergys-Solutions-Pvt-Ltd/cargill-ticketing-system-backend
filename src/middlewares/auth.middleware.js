import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { getConfig } from "../config/env.config.js";
import { MESSAGES } from "../constants/message.constants.js";
import logger from "../utils/logger.js";
import asyncWrapper from "../utils/asyncWrapper.js";

let client;

// Lazy-init: client created on first request, after loadConfig() has run
const getClient = () => {
  if (!client) {
    const config = getConfig();
    const tenantId = config.azureAd.tenantId;
    
    // Azure AD v2.0 JWKS endpoint
    client = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10, // Prevent abuse
    });
  }
  return client;
};

// Function to fetch the signing key matching the token's kid
const getKey = (header, callback) => {
  if (!header.kid) {
    return callback(new Error("No kid found in token header"), null);
  }
  getClient().getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err, null);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

export const authenticateJwt = asyncWrapper(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.sendResponse(MESSAGES.unauthorized);
  }
  
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.sendResponse(MESSAGES.unauthorized);
  }
  const config = getConfig();
  const clientId = config.azureAd.clientId;
  const tenantId = config.azureAd.tenantId;
  
  // Verify Options
  // Support both v2.0 and v1.0 Azure AD token issuers
  const verifyOptions = {
    audience: clientId,
    issuer: [
      `https://login.microsoftonline.com/${tenantId}/v2.0`,
      `https://sts.windows.net/${tenantId}/`
    ],
    algorithms: ["RS256"]
  };

  // Verify the JWT
  jwt.verify(token, getKey, verifyOptions, (err, decoded) => {
    if (err) {
      logger.warn({ err }, "MSAL JWT verification failed");
      return res.sendResponse(MESSAGES.unauthorized);
    }
    
    // The decoded token payload contains user info
    req.user = decoded; 
    
    // For compatibility with previous code, you might want to map claims.
    // Azure AD usually puts email in "preferred_username" or "upn".
    if (!req.user.email && req.user.preferred_username) {
      req.user.email = req.user.preferred_username;
    }
    if (!req.user.username && req.user.name) {
      req.user.username = req.user.name;
    }
    
    next();
  });
});