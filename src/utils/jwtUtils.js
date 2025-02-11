import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

// Payload should consist of
// {
//   id: user.id,
//   email: user.email,
//   role: user.role,
// }
export const generateToken = (payload) => {
  const auth_token = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRATION,
  });
  return auth_token;
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};
