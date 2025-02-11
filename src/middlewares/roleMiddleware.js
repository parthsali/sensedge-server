export const checkRole = (expectedRole) => {
  return (req, res, next) => {
    const user = req.user;

    const role = user.role;

    if (role !== expectedRole) {
      return res.status(403).json({
        message: `You don't have permission to access this route, only ${expectedRole} can access this route`,
      });
    }

    next();
  };
};
