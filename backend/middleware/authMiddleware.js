const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }

  // Accept token from Authorization header OR ?token= query param (needed for SSE/EventSource)
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

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
