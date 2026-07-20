const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const token = req.header("x-auth-token");

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    try {
      const decode = jwt.verify(token, process.env.jwtPrivateKey);
      req.user = decode;
      next();
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token!" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: `SERVER ERROR: ${error}` });
  }
}

module.exports = authMiddleware;
