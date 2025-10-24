const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = payload; // payload contains e.g. userId, email, role
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
