import express from "express";
import {
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  me,
  register,
} from "./authController.js";
import { auth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOTP);

router.put("/reset-password", resetPassword);

router.get("/me", auth, me);

// dev only
router.post("/register", register);

export default router;
