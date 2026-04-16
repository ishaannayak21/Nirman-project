import express from "express";
import {
  clearNotifications,
  getAdminNotifications,
  getUserNotifications,
  markNotificationRead
} from "../controllers/notificationController.js";
import protectAdmin, { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/admin", protectAdmin, getAdminNotifications);
router.get("/user", protectUser, getUserNotifications);
router.delete("/admin", protectAdmin, clearNotifications);
router.delete("/user", protectUser, clearNotifications);
router.patch("/admin/:id/read", protectAdmin, markNotificationRead);
router.patch("/user/:id/read", protectUser, markNotificationRead);

export default router;
