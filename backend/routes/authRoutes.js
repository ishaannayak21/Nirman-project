import express from "express";
import {
  forgotPassword,
  validateResetToken,
  loginAdmin,
  loginUser,
  registerUser,
  resetPassword,
  verifyAdmin,
  verifyUser
} from "../controllers/authController.js";
import protectAdmin, { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/user-login", loginUser);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", validateResetToken);
router.post("/reset-password/:token", resetPassword);
router.post("/login", loginAdmin);
router.get("/user-verify", protectUser, verifyUser);
router.get("/verify", protectAdmin, verifyAdmin);

export default router;
