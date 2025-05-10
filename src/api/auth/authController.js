import createHttpError from "http-errors";
import {
  loginSchema,
  resetPasswordSchema,
  userSchema,
  verifyOTPSchema,
} from "./authValidation.js";
import User from "../user/userModel.js";
import OTP from "./otpModel.js";
import { generateToken, verifyToken } from "../../utils/jwtUtils.js";
import { sendPasswordResetTemplate } from "../../services/emailService.js";

import { customAlphabet } from "nanoid";
import { logDebug, logInfo } from "../../utils/logger.js";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export const login = async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw createHttpError(401, "Invalid email or password");
    }

    if (user.isActive === false) {
      throw createHttpError(401, "User is not active, please contact admin");
    }

    const auth_token = generateToken({
      _id: user._id,
      email: user.email,
      role: user.role,
    });

    logInfo(`User ${user.email} logged in successfully`);

    res.status(200).json({ message: "Login successful", auth_token, user });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = req.user;

    const { error } = userSchema.validate(user);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { _id } = user;

    const userData = await User.findById(_id).select("-password");

    if (!userData) {
      throw createHttpError(404, "User not found");
    }

    logDebug(`User details fetched successfully for ${userData.email}`);

    res.status(200).json({
      message: "User details fetched successfully",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw createHttpError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    // delete all the previous OTPs for the particular email
    await OTP.deleteMany({ email });

    // randomly generate 6 digit password
    const otpNumber = Math.floor(100000 + Math.random() * 900000).toString();

    const otp = new OTP({ email, otp: otpNumber });

    await otp.save();

    const reset_url = `http://localhost:3000/api/v1/auth/reset-password/${otpNumber}`;

    await sendPasswordResetTemplate(
      user.name,
      user.email,
      otpNumber,
      reset_url
    );

    logInfo(`Password reset OTP sent to ${user.email}`);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { error } = verifyOTPSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { email, otp } = req.body;

    const otpDoc = await OTP.findOne({ email, otp });

    if (!otpDoc) {
      throw createHttpError(404, "Invalid OTP");
    }

    const token = generateToken(
      {
        email,
      },
      "30m"
    );

    logInfo(`OTP verified successfully for ${email}`);

    res.status(200).json({ message: "OTP verified successfully", token });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { error } = resetPasswordSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { token, password } = req.body;

    const decoded = verifyToken(token);

    if (!decoded) {
      throw createHttpError(401, "Invalid or expired token");
    }

    const { email } = decoded;

    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    user.password = password;

    await user.save();

    logInfo(`Password reset successfully for ${user.email}`);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = new User({
      _id: `admin-${nanoid()}`,
      employeeId: `admin-01`,
      name,
      email,
      password,
      role: "admin",
    });

    const auth_token = generateToken({
      _id: user._id,
      email: user.email,
      role: user.role,
    });

    await user.save();

    logInfo(`Admin registered successfully: ${user.email}`);

    res.status(201).json({ message: "Admin Registered", auth_token });
  } catch (error) {
    next(error);
  }
};
