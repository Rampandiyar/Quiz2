import User from '../Models/User.js';
import Token from '../Models/Token.js';
import config from '../config.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email.js';
import bcrypt from 'bcrypt';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('roles');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic profile info
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    // Handle email change with verification
    if (email && email !== user.email) {
      user.email = email;
      user.isVerified = false;

      // Generate verification token
      const verificationToken = new Token({
        user: user._id,
        token: jwt.sign({ id: user._id }, config.jwt.verificationTokenSecret),
        type: 'verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      await verificationToken.save();

      // Send verification email
      const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken.token}`;
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Updated Email',
        html: `Please click <a href="${verificationUrl}">here</a> to verify your new email address.`
      });
    }

    await user.save();

    res.json(await User.findById(user._id).select('-password').populate('roles'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens
    await Token.updateMany(
      { user: user._id, type: 'refresh' },
      { blacklisted: true }
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = new Token({
      user: user._id,
      token: jwt.sign({ id: user._id }, config.jwt.verificationTokenSecret),
      type: 'reset',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    await resetToken.save();

    // Send reset email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken.token}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `Please click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 1 hour.`
    });

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    
    // Verify token
    const tokenDoc = await Token.findOne({ token, type: 'reset' });
    if (!tokenDoc) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    jwt.verify(token, config.jwt.verificationTokenSecret, async (err, decoded) => {
      if (err) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Delete the used token
      await tokenDoc.deleteOne();

      // Invalidate all refresh tokens
      await Token.updateMany(
        { user: user._id, type: 'refresh' },
        { blacklisted: true }
      );

      res.json({ message: 'Password reset successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};