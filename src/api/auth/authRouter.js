import express from "express";
import { login, forgotPassword, resetPassword, me } from "./authController.js";
import { auth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.put("/reset-password", resetPassword);

router.get("/me", auth, me);

export default router;
