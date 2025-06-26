import nodemailer from 'nodemailer';
import config from '../config.js';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 */
export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"Quiz App" <${process.env.EMAIL_USERNAME}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send verification email
 * @param {Object} user - User object
 * @param {string} token - Verification token
 * @param {Object} req - Request object
 */
export const sendVerificationEmail = async (user, token, req) => {
  const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${token}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email',
    html: `
      <h1>Welcome to Quiz App</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>If you didn't create an account, please ignore this email.</p>
    `
  });
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} token - Reset token
 * @param {Object} req - Request object
 */
export const sendPasswordResetEmail = async (user, token, req) => {
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${token}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });
};