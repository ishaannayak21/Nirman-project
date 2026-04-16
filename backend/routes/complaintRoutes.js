import express from "express";
import {
  createComplaint,
  deleteComplaint,
  getComplaints,
  getMyComplaints,
  updateComplaintStatus
} from "../controllers/complaintController.js";
import protectAdmin, { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, getComplaints);
router.get("/mine", protectUser, getMyComplaints);
router.post("/", protectUser, createComplaint);
router.delete("/:id", protectUser, deleteComplaint);
router.delete("/admin/:id", protectAdmin, deleteComplaint);
router.patch("/:id/status", protectAdmin, updateComplaintStatus);

export default router;
