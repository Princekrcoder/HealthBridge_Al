const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Header se token uthao
  const authHeader = req.headers.authorization;

  // Token hai ya nahi
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Token verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User info request me attach
    req.user = decoded;

    next(); // aage jaane do
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
