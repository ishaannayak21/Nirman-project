import { getAdminToken, getUserToken } from "../utils/auth.js";

const NOTIFICATION_BASE_URL = "/api/notifications";

const handleNotificationResponse = async (response, defaultMessage) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || defaultMessage);
  }

  return data;
};

export const fetchAdminNotifications = async () => {
  const response = await fetch(`${NOTIFICATION_BASE_URL}/admin`, {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`
    }
  });

  return handleNotificationResponse(response, "Failed to fetch admin notifications.");
};

export const fetchUserNotifications = async () => {
  const response = await fetch(`${NOTIFICATION_BASE_URL}/user`, {
    headers: {
      Authorization: `Bearer ${getUserToken()}`
    }
  });

  return handleNotificationResponse(response, "Failed to fetch user notifications.");
};

export const markAdminNotificationRead = async (id) => {
  const response = await fetch(`${NOTIFICATION_BASE_URL}/admin/${id}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getAdminToken()}`
    }
  });

  return handleNotificationResponse(response, "Failed to update notification.");
};

export const markUserNotificationRead = async (id) => {
  const response = await fetch(`${NOTIFICATION_BASE_URL}/user/${id}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getUserToken()}`
    }
  });

  return handleNotificationResponse(response, "Failed to update notification.");
};

export const clearAdminNotifications = async () => {
  const response = await fetch(`${NOTIFICATION_BASE_URL}/admin`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getAdminToken()}`
    }
  });

  return handleNotificationResponse(response, "Failed to clear notifications.");
};

export const clearUserNotifications = async () => {
  const response = await fetch(`${NOTIFICATION_BASE_URL}/user`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getUserToken()}`
    }
  });

  return handleNotificationResponse(response, "Failed to clear notifications.");
};
