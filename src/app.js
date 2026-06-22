import express from "express";
import cors from "cors";
import apiRouter from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import { responseHelper } from "./middlewares/responseHelper.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(responseHelper);

app.use("/api/v1", apiRouter);

app.use(errorHandler);

export default app;
