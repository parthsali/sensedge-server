import express from "express";
import cors from "cors";

import authRouter from "./api/auth/authRouter.js";
import userRouter from "./api/user/userRouter.js";
import adminRouter from "./api/admin/adminRouter.js";
import customerRouter from "./api/customer/customerRouter.js";
import templateRouter from "./api/template/templateRouter.js";
import conversationRouter from "./api/conversation/conversationRouter.js";
import messageRouter from "./api/message/messageRouter.js";

import globalErrorHandler from "./middlewares/globalErrorHandler.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res, next) => {
  res.status(200).json({ message: "Welcome to Sensedge APIs" });
});

app.get("/health", (req, res, next) => {
  res.status(200).json({ message: "Server is up and running" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/templates", templateRouter);
app.use("/api/v1/conversations", conversationRouter);
app.use("/api/v1/messages", messageRouter);

app.use(globalErrorHandler);

export default app;
