import { logWarning } from "../utils/logger.js";

export const checkRole = (expectedRole) => {
  return (req, res, next) => {
    const user = req.user;

    const role = user.role;

    if (role !== expectedRole) {
      logWarning(
        `User with email ${user.email} tried to access ${req.originalUrl} with role ${role}, but only ${expectedRole} can access this route`
      );
      return res.status(403).json({
        message: `You don't have permission to access this route, only ${expectedRole} can access this route`,
      });
    }

    next();
  };
};
