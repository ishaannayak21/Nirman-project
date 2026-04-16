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

export const createComplaint = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      category,
      location,
      nearestCity,
      ward,
      landmark,
      message,
      attachmentUrl
    } = req.body;

    const loggedInUser = req.user?.id ? await User.findById(req.user.id) : null;
    const complaintName = loggedInUser?.name || name;
    const complaintEmail = loggedInUser?.email || email;

    if (!complaintName || !complaintEmail || !category || !location || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, category, location, and message are required."
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

export const getComplaints = async (_req, res) => {
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
