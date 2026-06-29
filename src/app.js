import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import apiRouter from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import { responseHelper } from "./middlewares/responseHelper.js";
import helmet from "helmet";
import logger from "./utils/logger.js";
import { MESSAGES } from "./constants/message.constants.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
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
