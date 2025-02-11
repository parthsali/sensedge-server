import express from "express";

import authRouter from "./api/auth/authRouter.js";
import userRouter from "./api/user/userRouter.js";
import adminRouter from "./api/admin/adminRouter.js";

import globalErrorHandler from "./middlewares/globalErrorHandler.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res, next) => {
  res.status(200).json({ message: "Welcome to Sensedge APIs" });
});

app.get("/health", (req, res, next) => {
  res.status(200).json({ message: "API is running" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);

app.use(globalErrorHandler);

export default app;
