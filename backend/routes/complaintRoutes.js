import express from "express";
import {
  analyzeComplaint,
  createComplaint,
  deleteComplaint,
  getComplaints,
  getMyComplaints,
  updateComplaintStatus,
  checkDuplicateComplaint,
  supportComplaint,
  getPublicStats
} from "../controllers/complaintController.js";
import protectAdmin, { protectUser } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads/complaints");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `img_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

const router = express.Router();

router.post("/analyze", analyzeComplaint);
router.post("/check-duplicate", checkDuplicateComplaint);
router.patch("/:id/support", supportComplaint);
router.post("/upload", upload.single("image"), (req, res) => {
   if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
   const imageUrl = `/uploads/complaints/${req.file.filename}`;
   
   // Extremely minimal AI tagging base on filename
   const filenameLower = req.file.originalname.toLowerCase();
   const autoTags = [];
   if (filenameLower.match(/(pothole|road|crack)/)) autoTags.push("road damage");
   if (filenameLower.match(/(water|leak|pipe)/)) autoTags.push("water leak");
   if (filenameLower.match(/(garbage|trash|waste)/)) autoTags.push("garbage");

   return res.status(200).json({ success: true, imageUrl, autoTags });
});

router.get("/stats", getPublicStats);
router.get("/", protectAdmin, getComplaints);
router.get("/mine", protectUser, getMyComplaints);
router.post("/", protectUser, createComplaint);
router.delete("/:id", protectUser, deleteComplaint);
router.delete("/admin/:id", protectAdmin, deleteComplaint);
router.patch("/:id/status", protectAdmin, updateComplaintStatus);

export default router;
