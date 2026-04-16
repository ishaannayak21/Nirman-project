import Notification from "../models/Notification.js";

export const getAdminNotifications = async (_req, res) => {
  try {
    const notifications = await Notification.find({ audience: "admin" })
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin notifications.",
      error: error.message
    });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      audience: "user",
      user: req.user.id
    })
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user notifications.",
      error: error.message
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found."
      });
    }

    const canAccess =
      notification.audience === "admin"
        ? req.admin
        : String(notification.user) === String(req.user.id);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to update this notification."
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
      error: error.message
    });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    if (req.admin) {
      await Notification.deleteMany({ audience: "admin" });
    } else {
      await Notification.deleteMany({
        audience: "user",
        user: req.user.id
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notifications cleared successfully."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to clear notifications.",
      error: error.message
    });
  }
};
