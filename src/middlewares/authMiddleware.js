import createHttpError from "http-errors";
import { verifyToken } from "../utils/jwtUtils.js";

export const auth = async (req, res, next) => {
  try {
    const authorization = req.header("Authorization");

    if (!authorization) {
      throw createHttpError(401, "Authorization required");
    }

    const auth_token = authorization.split(" ")[1];

    if (!auth_token) {
      throw createHttpError(401, "Authorization required");
    }

    // Verify token
    const decoded = await verifyToken(auth_token);

    if (!decoded) {
      throw createHttpError(401, "Invalid token");
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
