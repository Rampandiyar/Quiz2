import nodemailer from 'nodemailer';
import config from '../config';

// Create transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"Quiz App" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

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