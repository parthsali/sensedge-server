import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";

const app = express();

app.get("/", (req, res, next) => {
  res.status(200).json({ message: "Welcome to Sensedge APIs" });
});

app.use(globalErrorHandler);

export default app;
