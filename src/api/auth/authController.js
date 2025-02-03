import createHttpError from "http-errors";
import { loginSchema } from "./authValidation.js";
import User from "../user/userModel.js";

export const login = async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.isPasswordMatch(password))) {
      throw createHttpError(401, "Invalid email or password");
    }

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    next(error);
  }
};
