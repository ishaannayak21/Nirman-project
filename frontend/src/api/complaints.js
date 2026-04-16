import {
  clearAdminSession,
  getAdminToken,
  getUserToken
} from "../utils/auth.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/complaints";

const handleResponse = async (response, defaultMessage) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || defaultMessage);
  }

  return data;
};

export const analyzeComplaint = async (message) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    return await handleResponse(response, "Failed to analyze complaint.");
  } catch (error) {
    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};

export const checkDuplicateComplaint = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await handleResponse(response, "Failed to check duplicates.");
  } catch (error) {
    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};

export const supportComplaint = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/support`, {
      method: "PATCH"
    });
    return await handleResponse(response, "Failed to support complaint.");
  } catch (error) {
    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};

export const uploadComplaintImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData
    });
    return await handleResponse(response, "Failed to upload image.");
  } catch (error) {
    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};

export const fetchPublicStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    return await handleResponse(response, "Failed to fetch stats.");
  } catch (error) {
    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};

export const fetchComplaints = async () => {
  try {
    const response = await fetch(API_BASE_URL, {
      headers: {
        Authorization: `Bearer ${getAdminToken()}`
      }
    });
    return await handleResponse(response, "Failed to fetch complaints.");
  } catch (error) {
    if (error.message === "Invalid or expired token.") {
      clearAdminSession();
      throw new Error("Session expired. Please login again.");
    }

    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};

export const submitComplaint = async (complaintData) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getUserToken()
          ? {
              Authorization: `Bearer ${getUserToken()}`
            }
          : {})
      },
      body: JSON.stringify(complaintData)
    });

    return await handleResponse(response, "Failed to submit complaint.");
  } catch (error) {
    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};

export const fetchMyComplaints = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/mine`, {
      headers: {
        Authorization: `Bearer ${getUserToken()}`
      }
    });

    return await handleResponse(response, "Failed to fetch your complaints.");
  } catch (error) {
    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};

export const deleteMyComplaint = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getUserToken()}`
      }
    });

    return await handleResponse(response, "Failed to delete complaint.");
  } catch (error) {
    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};

export const updateComplaintStatus = async (id, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify({ status })
    });

    return await handleResponse(response, "Failed to update complaint status.");
  } catch (error) {
    if (error.message === "Invalid or expired token.") {
      clearAdminSession();
      throw new Error("Session expired. Please login again.");
    }

    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};

export const deleteComplaintAsAdmin = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getAdminToken()}`
      }
    });

    return await handleResponse(response, "Failed to delete complaint.");
  } catch (error) {
    throw error.message ? error : new Error("Cannot connect to backend server.");
  }
};
