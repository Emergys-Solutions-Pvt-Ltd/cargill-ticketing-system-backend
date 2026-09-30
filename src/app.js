import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import apiRouter from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import { responseHelper } from "./middlewares/responseHelper.js";
import helmet from "helmet";
import logger from "./utils/logger.js";
import { MESSAGES } from "./constants/message.constants.js";

const app = express();

app.use(express.json());
app.use(cors());
// CSP disabled — swagger-ui-express uses inline styles/scripts that CSP blocks.
// Scope CSP restriction to non-docs routes if needed in production.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(pinoHttp({
  logger,
  genReqId: () => crypto.randomUUID(), // Node 22 global — no import needed
  serializers: {
    req: (req) => ({ reqId: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
}));
app.use(responseHelper);

// Swagger UI — must come before apiRouter so helmet CSP exclusion above applies
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Cargil API Docs",
  swaggerOptions: { persistAuthorization: true },
}));

app.use("/api/v1", apiRouter);

// 404 — catch all unmatched routes, return JSON (not Express default HTML)
app.use((req, res) => {
  res.status(MESSAGES.notFound.statusCode).json({
    success: MESSAGES.notFound.statusFlag,
    message: MESSAGES.notFound.messageText,
  });
});

app.use(errorHandler);

export default app;
