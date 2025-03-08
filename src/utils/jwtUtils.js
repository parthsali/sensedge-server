import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

// Payload should consist of
// {
//   id: user.id,
//   email: user.email,
//   role: user.role,
// }
export const generateToken = (payload, expiresIn = config.JWT_EXPIRATION) => {
  const auth_token = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: expiresIn,
  });
  return auth_token;
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};
