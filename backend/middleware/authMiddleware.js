import jwt from "jsonwebtoken";

const getDecodedToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  return jwt.verify(
    token,
    process.env.JWT_SECRET || "grievance-platform-secret"
  );
};

const protectAdmin = (req, res, next) => {
  try {
    const decoded = getDecodedToken(req);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required."
      });
    }

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required."
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

export const protectUser = (req, res, next) => {
  try {
    const decoded = getDecodedToken(req);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required."
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

export const attachOptionalUser = (req, _res, next) => {
  try {
    const decoded = getDecodedToken(req);
    req.user = decoded || null;
    next();
  } catch (_error) {
    req.user = null;
    next();
  }
};

export default protectAdmin;
