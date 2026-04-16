import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isMailConfigured, sendResetPasswordEmail } from "../utils/emailService.js";

const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "grievance-platform-secret", {
    expiresIn: "1d"
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (global.IS_DEMO_MODE) {
      const token = signToken({ id: "demo-user-id", email: email.toLowerCase(), role: "citizen" });
      return res.status(201).json({ success: true, message: "Demo Registration successful.", data: { token, user: { id: "demo-user-id", name, email: email.toLowerCase(), role: "citizen" } } });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters."
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to register user.",
      error: error.message
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (global.IS_DEMO_MODE) {
      const token = signToken({ id: "demo-user-id", email: email.toLowerCase(), role: "citizen" });
      return res.status(200).json({ success: true, message: "Demo Login successful.", data: { token, user: { id: "demo-user-id", name: "Demo User", email: email.toLowerCase(), role: "citizen" } } });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to login.",
      error: error.message
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been sent."
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;
    const mailResult = await sendResetPasswordEmail({
      email: user.email,
      name: user.name,
      resetUrl
    });

    return res.status(200).json({
      success: true,
      message: mailResult.sent
        ? "Reset password link sent to your email."
        : "Email service is not configured. Use the reset link from the response for local testing.",
      data: mailResult.sent
        ? {}
        : {
            resetUrl,
            mailConfigured: isMailConfigured()
          }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request.",
      error: error.message
    });
  }
};

export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or expired."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reset link is valid."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to validate reset link.",
      error: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters."
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or expired."
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpiresAt = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reset password.",
      error: error.message
    });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@grievance.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials."
      });
    }

    const token = signToken({
      role: "admin",
      email: adminEmail
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        admin: {
          email: adminEmail,
          role: "admin"
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to login.",
      error: error.message
    });
  }
};

export const verifyAdmin = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      admin: req.admin
    }
  });
};

export const verifyUser = async (req, res) => {
  if (global.IS_DEMO_MODE) {
     return res.status(200).json({ success: true, data: { user: { _id: req.user.id, name: "Demo User", email: req.user.email, role: "citizen" } } });
  }

  const user = await User.findById(req.user.id).select("-password");

  return res.status(200).json({
    success: true,
    data: {
      user
    }
  });
};
