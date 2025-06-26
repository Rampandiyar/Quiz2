import jwt from 'jsonwebtoken';
import User from '../Models/User.js';
import Token from '../Models/Token.js';
import { sendEmail } from '../Utils/email.js';
import config from '../config.js';
import crypto from 'crypto';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, roles: user.roles },
    config.jwt.accessTokenSecret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );
  
  const refreshToken = jwt.sign(
    { id: user._id },
    config.jwt.refreshTokenSecret,
    { expiresIn: config.jwt.refreshTokenExpiry }
  );
  
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, registrationNumber, department, year } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { registrationNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      registrationNumber,
      department,
      year
    });
    
    await user.save();
    
    const verificationToken = new Token({
      user: user._id,
      token: crypto.randomBytes(32).toString('hex'),
      type: 'verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    
    await verificationToken.save();
    
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken.token}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      html: `Please click <a href="${verificationUrl}">here</a> to verify your email.`
    });
    
    res.status(201).json({ message: 'Registration successful. Please check your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).populate('roles');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    const tokenDoc = new Token({
      user: user._id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    await tokenDoc.save();
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(204).end();
    
    await Token.findOneAndUpdate(
      { token: refreshToken },
      { blacklisted: true }
    );
    
    res.clearCookie('refreshToken');
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'Unauthorized' });
    
    const tokenDoc = await Token.findOne({ token: refreshToken, blacklisted: false });
    if (!tokenDoc) return res.status(403).json({ message: 'Forbidden' });
    
    jwt.verify(refreshToken, config.jwt.refreshTokenSecret, async (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Forbidden' });
      
      const user = await User.findById(decoded.id).populate('roles');
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      const { accessToken } = generateTokens(user);
      res.json({ accessToken });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token = await Token.findOne({ 
      token: req.params.token,
      type: 'verification'
    });
    
    if (!token) return res.status(400).json({ message: 'Invalid token' });
    
    const user = await User.findById(token.user);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isVerified = true;
    await user.save();
    await token.deleteOne();
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset',
      html: `Click <a href="${resetUrl}">here</a> to reset your password.`
    });
    
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};