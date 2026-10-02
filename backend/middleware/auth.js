// middleware/auth.js
// Middleware = a function that runs BETWEEN the request arriving and the route handler.
// Think of it as a security guard standing in front of a door.
const jwt = require("jsonwebtoken");

// Read the secret when it is needed (after dotenv has loaded .env).
// The fallback keeps the project working even if JWT_SECRET is missing from .env.
function getSecret() {
  return process.env.JWT_SECRET || "secret123";
}

// Guard 1: AUTHENTICATION - "Are you logged in?"
function verifyToken(req, res, next) {
  // The frontend sends:  Authorization: Bearer <token>
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Please log in first." });
  }

  try {
    // verify() checks the signature and expiry. It throws an error if the token is fake or old.
    req.user = jwt.verify(token, getSecret()); // save who the user is for later steps
    next(); // token is fine -> let the request continue
  } catch (err) {
    return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
  }
}

// Guard 2: AUTHORIZATION - "Are you allowed to do this? (admins only)"
function adminOnly(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access only." });
}

module.exports = { verifyToken, adminOnly, getSecret };
