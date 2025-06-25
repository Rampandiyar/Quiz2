import User from '../Models/User.js';
import Token from '../Models/Token.js';
import Role from '../Models/Role.js';
import { sendEmail } from '../Utils/email.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { fileDelete, fileUpload } from '../utils/fileUpload.js';

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, registrationNumber, department, year } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { registrationNumber }] 
    });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email or registration number'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      registrationNumber,
      department,
      year,
      roles: await Role.find({ isDefault: true })
    });

    // Generate verification token
    const verificationToken = new Token({
      user: user._id,
      token: crypto.randomBytes(32).toString('hex'),
      type: 'verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    await verificationToken.save();

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/users/verify-email/${verificationToken.token}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      html: `Please click <a href="${verificationUrl}">here</a> to verify your email.`
    });

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and password is correct
    const user = await User.findByCredentials(email, password);
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
};

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
      .populate('roles');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PATCH /api/users/update-profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, bio } = req.body;
    const updates = { firstName, lastName, phoneNumber, bio };

    // Handle email change separately
    if (req.body.email && req.body.email !== req.user.email) {
      updates.email = req.body.email;
      updates.isVerified = false;

      // Generate new verification token
      const verificationToken = new Token({
        user: req.user.id,
        token: crypto.randomBytes(32).toString('hex'),
        type: 'verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await verificationToken.save();

      // Send verification email
      const verificationUrl = `${req.protocol}://${req.get('host')}/api/users/verify-email/${verificationToken.token}`;
      await sendEmail({
        to: req.body.email,
        subject: 'Verify Your Updated Email',
        html: `Please click <a href="${verificationUrl}">here</a> to verify your new email address.`
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PATCH /api/users/update-password
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = req.body.newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Generate new token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      token,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      html: `Please click <a href="${resetUrl}">here</a> to reset your password.`
    });

    res.json({
      success: true,
      message: 'Password reset token sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    next(error);
  }
};

// @desc    Reset password
// @route   PATCH /api/users/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    // Generate new token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      token,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/users/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const token = await Token.findOne({
      token: req.params.token,
      type: 'verification'
    });

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const user = await User.findById(token.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isVerified = true;
    await user.save();
    await token.deleteOne();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/users/resend-verification
// @access  Public
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Delete any existing verification tokens
    await Token.deleteMany({ user: user._id, type: 'verification' });

    // Generate new verification token
    const verificationToken = new Token({
      user: user._id,
      token: crypto.randomBytes(32).toString('hex'),
      type: 'verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await verificationToken.save();

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/users/verify-email/${verificationToken.token}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      html: `Please click <a href="${verificationUrl}">here</a> to verify your email.`
    });

    res.json({
      success: true,
      message: 'Verification email resent'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload user photo
// @route   POST /api/users/upload-photo
// @access  Private
export const uploadUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Upload to cloud storage
    const result = await fileUpload(req.file.path, 'users');

    // Delete old photo if exists
    const user = await User.findById(req.user.id);
    if (user.profilePicture && user.profilePicture !== 'default.jpg') {
      await fileDelete(user.profilePicture);
    }

    // Update user photo
    user.profilePicture = result.secure_url;
    await user.save();

    res.json({
      success: true,
      photoUrl: result.secure_url
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/delete-account
// @access  Private
export const deleteUserAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Delete profile photo if exists
    if (user.profilePicture && user.profilePicture !== 'default.jpg') {
      await fileDelete(user.profilePicture);
    }

    await user.deleteOne();

    // Delete all tokens
    await Token.deleteMany({ user: user._id });

    res.status(204).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
export const logoutUser = async (req, res, next) => {
  try {
    // Blacklist the token
    await Token.findOneAndUpdate(
      { token: req.token, type: 'access' },
      { blacklisted: true }
    );

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Admin-only controllers below...

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
      .populate('roles');

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
      .populate('roles');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (admin)
// @route   PATCH /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const { roles, ...updateData } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update roles if provided
    if (roles) {
      const roleDocuments = await Role.find({ _id: { $in: roles } });
      user.roles = roleDocuments;
    }

    Object.assign(user, updateData);
    await user.save();

    res.json({
      success: true,
      user: await User.findById(user._id)
        .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
        .populate('roles')
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete profile photo if exists
    if (user.profilePicture && user.profilePicture !== 'default.jpg') {
      await fileDelete(user.profilePicture);
    }

    await user.deleteOne();

    // Delete all tokens
    await Token.deleteMany({ user: user._id });

    res.status(204).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};