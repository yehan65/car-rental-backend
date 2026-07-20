function roleMiddleware(...roles) {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated, Must login first!",
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden!, ${user.role} cannot access this resource`,
        });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error.message}` });
    }
  };
}

module.exports = roleMiddleware;
