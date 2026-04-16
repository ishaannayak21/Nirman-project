import Notification from "../models/Notification.js";

export const createNotification = async ({
  io,
  audience,
  user = null,
  type = "info",
  title,
  message,
  link = "",
  metadata = {}
}) => {
  const notification = await Notification.create({
    audience,
    user,
    type,
    title,
    message,
    link,
    metadata
  });

  if (io) {
    io.emit("notification:new", {
      ...notification.toObject(),
      targetUserId: user ? String(user) : null
    });
  }

  return notification;
};
