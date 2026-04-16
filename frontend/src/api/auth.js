const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || "/api/auth";

const handleAuthResponse = async (response, defaultMessage) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || defaultMessage);
  }

  return data;
};

const rethrowAuthError = (error) => {
  if (error instanceof Error) {
    throw error;
  }

  throw new Error("Cannot connect to backend server.");
};

export const loginAdmin = async (credentials) => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(credentials)
    });

    return await handleAuthResponse(response, "Failed to login.");
  } catch (error) {
    rethrowAuthError(error);
  }
};

export const registerUser = async (payload) => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return await handleAuthResponse(response, "Failed to register.");
  } catch (error) {
    rethrowAuthError(error);
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/user-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(credentials)
    });

    return await handleAuthResponse(response, "Failed to login.");
  } catch (error) {
    rethrowAuthError(error);
  }
};

export const forgotPassword = async (payload) => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return await handleAuthResponse(response, "Failed to send reset email.");
  } catch (error) {
    rethrowAuthError(error);
  }
};

export const resetPassword = async (token, payload) => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/reset-password/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return await handleAuthResponse(response, "Failed to reset password.");
  } catch (error) {
    rethrowAuthError(error);
  }
};

export const validateResetToken = async (token) => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/reset-password/${token}`);

    return await handleAuthResponse(response, "Failed to validate reset link.");
  } catch (error) {
    rethrowAuthError(error);
  }
};

export const verifyAdmin = async (token) => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/verify`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return await handleAuthResponse(response, "Failed to verify session.");
  } catch (error) {
    rethrowAuthError(error);
  }
};
