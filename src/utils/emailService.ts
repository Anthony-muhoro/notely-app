import transporter from "../config/nodemailer";
import { ApiError } from "./apiError";

export const sendVerificationEmail = async (
  email: string,
  verificationToken: string,
  firstName: string
): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Verify Your Email - Notely",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${firstName},</h2>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, "Failed to send verification email");
  }
};

export const sendResetPasswordEmail = async (
  email: string,
  resetToken: string,
  firstName: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Reset Your Password - Notely",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${firstName},</h2>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, "Failed to send reset password email");
  }
};
