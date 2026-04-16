import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import { isMailConfigured, sendComplaintStatusEmail } from "../utils/emailService.js";
import { createNotification } from "../utils/notificationHelpers.js";
import {
  buildAiInsights,
  buildAiSummary,
  createTicketId,
  detectCategoryDetails,
  detectPriority
} from "../utils/complaintHelpers.js";
import { getGeoDistance, getTextSimilarity } from "../utils/deduplication.js";

const MOCK_COMPLAINTS = [
  { _id: "demo1", ticketId: "DEMO-001", name: "Ravi K.", phone: "", email: "demo@grievance.com", department: "Public Works", message: "Road needs repair immediately.", category: "Infrastructure", status: "Pending", priority: "High", lat: 20.59, lng: 78.96, createdAt: new Date(), updatedAt: new Date() },
  { _id: "demo2", ticketId: "DEMO-002", name: "Sunita M.", phone: "", email: "demo2@grievance.com", department: "Waste Management", message: "Garbage not collected for weeks.", category: "Sanitation", status: "In Progress", priority: "Medium", supportCount: 12, lat: 20.58, lng: 78.97, createdAt: new Date(), updatedAt: new Date() },
  { _id: "demo3", ticketId: "DEMO-003", name: "Anil P.", phone: "9876543210", email: "anil@grievance.com", department: "Water Supply", message: "No water in sector 4.", category: "Utility", status: "Resolved", priority: "High", supportCount: 45, lat: 20.60, lng: 78.95, createdAt: new Date(), updatedAt: new Date() }
];

export const getPublicStats = async (req, res) => {
  if (global.IS_DEMO_MODE) {
    return res.status(200).json({ success: true, data: { total: 3, resolved: 1, pending: 2, topCategory: "Infrastructure", highPriorityAlerts: 1, duplicatesPrevented: 57 } });
  }

  try {
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: "Resolved" });
    const pending = total - resolved;

    const topCategoryResult = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const topCategory = topCategoryResult.length && topCategoryResult[0]._id ? topCategoryResult[0]._id : "General";

    const topSupportedResult = await Complaint.aggregate([
       { $match: { supportCount: { $gt: 0 } } },
       { $group: { _id: null, totalSaved: { $sum: "$supportCount" } } }
    ]);
    const duplicatesPrevented = topSupportedResult.length ? topSupportedResult[0].totalSaved : 0;

    const highPriorityAlerts = await Complaint.countDocuments({ 
       status: { $ne: "Resolved" }, 
       priority: { $in: ["High", "Critical"] } 
    });

    return res.status(200).json({
      success: true,
      data: { total, resolved, pending, topCategory, highPriorityAlerts, duplicatesPrevented }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createComplaint = async (req, res) => {
  if (global.IS_DEMO_MODE) {
    return res.status(201).json({ success: true, complaint: { ...req.body, _id: "demo-new", ticketId: "DEMO-NEW", status: "Pending", priority: "Medium", createdAt: new Date() } });
  }

  try {
    const {
      name,
      email,
      phone,
      category,
      location,
      lat,
      lng,
      nearestCity,
      ward,
      landmark,
      message,
      attachmentUrl
    } = req.body;

    const loggedInUser = req.user?.id ? await User.findById(req.user.id) : null;
    const complaintName = loggedInUser?.name || name;
    const complaintEmail = loggedInUser?.email || email;

    if (!complaintName || !complaintEmail || !location || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, location, and message are required."
      });
    }

    const detectedDetails = detectCategoryDetails(category, message);
    const priority = detectPriority(message);
    const ticketId = createTicketId();
    const aiInsights = buildAiInsights({
      category: detectedDetails.category,
      message,
      location: ward ? `${location}, ${ward}` : location
    });
    const aiSummary = buildAiSummary({
      category: detectedDetails.category,
      location: ward ? `${location}, ${ward}` : location,
      priority,
      message
    });

    const complaint = await Complaint.create({
      user: loggedInUser?._id || null,
      ticketId,
      name: complaintName,
      email: complaintEmail,
      phone: phone || "",
      category: detectedDetails.category,
      location,
      lat: lat || null,
      lng: lng || null,
      nearestCity: nearestCity || "",
      ward: ward || "",
      landmark: landmark || "",
      department: detectedDetails.department,
      priority,
      message,
      aiSummary,
      aiCategoryConfidence: detectedDetails.confidence || 0.55,
      aiTags: detectedDetails.tags || [],
      aiSentiment: aiInsights.sentiment,
      aiUrgencyDrivers: aiInsights.urgencyDrivers,
      aiRecommendedAction: aiInsights.recommendedAction,
      attachmentUrl: attachmentUrl || "",
      statusHistory: [
        {
          status: "Pending",
          note: loggedInUser
            ? "Complaint submitted from citizen account."
            : "Complaint submitted successfully."
        }
      ]
    });

    const io = req.app.get("io");

    await createNotification({
      io,
      audience: "admin",
      type: "complaint",
      title: "New complaint received",
      message: `${complaint.ticketId} was submitted in ${complaint.category}.`,
      link: "/dashboard",
      metadata: {
        complaintId: complaint._id,
        priority: complaint.priority
      }
    });

    if (loggedInUser) {
      await createNotification({
        io,
        audience: "user",
        user: loggedInUser._id,
        type: "complaint",
        title: "Complaint submitted",
        message: `${complaint.ticketId} has been created successfully.`,
        link: "/my-complaints",
        metadata: {
          complaintId: complaint._id,
          status: complaint.status
        }
      });
    }

    if (io) {
      io.emit("complaint:created", complaint.toObject());
    }

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully.",
      data: complaint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to submit complaint.",
      error: error.message
    });
  }
};

export const checkDuplicateComplaint = async (req, res) => {
  if (global.IS_DEMO_MODE) return res.status(200).json({ success: true, duplicate: false, confidence: 0 });

  try {
    const { message, lat, lng } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message required" });

    const recentComplaints = await Complaint.find({ status: { $ne: "Resolved" } })
      .sort({ createdAt: -1 })
      .limit(100);
    
    let bestMatch = null;
    let highestScore = 0;

    for (const comp of recentComplaints) {
      let isGeoMatch = false;
      const textSim = getTextSimilarity(message, comp.message);

      if (lat && lng && comp.lat && comp.lng) {
         const dist = getGeoDistance(lat, lng, comp.lat, comp.lng);
         if (dist < 100) isGeoMatch = true; 
      } else {
         isGeoMatch = true; 
      }

      if (isGeoMatch && textSim > highestScore && textSim >= 0.70) {
        highestScore = textSim;
        bestMatch = comp;
      } else if (!isGeoMatch && textSim > highestScore && textSim >= 0.85) {
         // High strictness if no geo match
         highestScore = textSim;
         bestMatch = comp;
      }
    }

    if (bestMatch && highestScore >= 0.75) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        confidence: highestScore,
        existingComplaint: bestMatch,
        message: "Similar complaint already exists nearby"
      });
    }

    return res.status(200).json({ success: true, duplicate: false });
  } catch (error) {
     return res.status(500).json({ success: false, error: error.message });
  }
};

export const supportComplaint = async (req, res) => {
  if (global.IS_DEMO_MODE) return res.status(200).json({ success: true, message: "Supported in demo mode" });

  try {
     const { id } = req.params;
     const complaint = await Complaint.findById(id);
     if (!complaint) return res.status(404).json({ success: false, message: "Not found" });

     complaint.supportCount = (complaint.supportCount || 0) + 1;
     await complaint.save();

     const io = req.app.get("io");
     if (io) io.emit("complaint:updated", complaint.toObject());

     return res.status(200).json({ success: true, data: complaint, message: "Supported" });
  } catch (error) {
     return res.status(500).json({ success: false, error: error.message });
  }
};

export const analyzeComplaint = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required for analysis."
      });
    }

    const detectedDetails = detectCategoryDetails("", message);
    const priority = detectPriority(message);

    return res.status(200).json({
      success: true,
      data: {
        category: detectedDetails.category,
        department: detectedDetails.department,
        priority
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to analyze complaint.",
      error: error.message
    });
  }
};

export const getComplaints = async (_req, res) => {
  if (global.IS_DEMO_MODE) return res.status(200).json({ success: true, data: MOCK_COMPLAINTS });

  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints.",
      error: error.message
    });
  }
};

export const getMyComplaints = async (req, res) => {
  if (global.IS_DEMO_MODE) return res.status(200).json({ success: true, data: MOCK_COMPLAINTS });

  try {
    const complaints = await Complaint.find({ user: req.user.id }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your complaints.",
      error: error.message
    });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required."
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found."
      });
    }

    complaint.status = status;
    complaint.statusHistory.push({
      status,
      note: `Status changed to ${status} by admin.`
    });

    await complaint.save();

    const io = req.app.get("io");

    if (complaint.user) {
      await createNotification({
        io,
        audience: "user",
        user: complaint.user,
        type: "status-update",
        title: "Complaint status updated",
        message: `${complaint.ticketId} moved to ${status}.`,
        link: "/my-complaints",
        metadata: {
          complaintId: complaint._id,
          status
        }
      });
    }

    await createNotification({
      io,
      audience: "admin",
      type: "workflow",
      title: "Complaint workflow updated",
      message: `${complaint.ticketId} status changed to ${status}.`,
      link: "/dashboard",
      metadata: {
        complaintId: complaint._id,
        status
      }
    });

    if (io) {
      io.emit("complaint:updated", complaint.toObject());
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    if (isMailConfigured()) {
      await sendComplaintStatusEmail({
        email: complaint.email,
        name: complaint.name,
        ticketId: complaint.ticketId,
        status,
        dashboardUrl: `${clientUrl}/my-complaints`
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint status updated successfully.",
      data: complaint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update complaint status.",
      error: error.message
    });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found."
      });
    }

    const isAdminRequest = Boolean(req.admin);
    const isOwner =
      req.user && complaint.user && String(complaint.user) === String(req.user.id);

    if (!isAdminRequest && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this complaint."
      });
    }

    await complaint.deleteOne();

    const io = req.app.get("io");

    if (io) {
      io.emit("complaint:deleted", {
        _id: id
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete complaint.",
      error: error.message
    });
  }
};
