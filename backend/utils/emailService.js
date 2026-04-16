import nodemailer from "nodemailer";

const isMailConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
};

const createTransporter = () => {
  if (!isMailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export const sendResetPasswordEmail = async ({ email, name, resetUrl }) => {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      sent: false
    };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your Grievance Platform password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${name},</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 15 minutes.</p>
      </div>
    `
  });

  return {
    sent: true
  };
};

export const sendComplaintStatusEmail = async ({
  email,
  name,
  ticketId,
  status,
  dashboardUrl
}) => {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      sent: false
    };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: `Complaint ${ticketId} updated to ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${name},</h2>
        <p>Your complaint <strong>${ticketId}</strong> has been updated.</p>
        <p>Current status: <strong>${status}</strong></p>
        <p>
          <a href="${dashboardUrl}" style="display:inline-block;padding:12px 18px;background:#15803d;color:#ffffff;text-decoration:none;border-radius:8px;">
            View My Complaints
          </a>
        </p>
      </div>
    `
  });

  return {
    sent: true
  };
};

export { isMailConfigured };
