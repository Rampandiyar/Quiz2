import jwt from 'jsonwebtoken';
import User from '../Models/User.js';
import Token from '../Models/Token.js';
import Role from '../Models/Role.js';
import { sendEmail } from '../Utils/email.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, registrationNumber, department, year } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { registrationNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      registrationNumber,
      department,
      year,
      roles: await Role.find({ isDefault: true })
    });
    
    await user.save();
    
    // Generate verification token
    const verificationToken = new Token({
      user: user._id,
      token: jwt.sign({ id: user._id }, process.env.VERIFICATION_TOKEN_SECRET),
      type: 'verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    
    await verificationToken.save();
    
    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken.token}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      html: `Please click <a href="${verificationUrl}">here</a> to verify your email.`
    });
    
    res.status(201).json({ message: 'User registered. Please check your email for verification.' });
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
    
    // Save refresh token
    const token = new Token({
      user: user._id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    await token.save();
    
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

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const tokenDoc = await Token.findOne({ token: refreshToken });
    if (!tokenDoc || tokenDoc.blacklisted) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const user = await User.findById(decoded.id).populate('roles');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { accessToken } = generateTokens(user);
      res.json({ accessToken });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(204).end();
    }
    
    // Blacklist the refresh token
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

export const verifyEmail = async (req, res) => {
  try {
    const token = await Token.findOne({
      token: req.params.token,
      type: 'verification'
    });
    
    if (!token) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    const user = await User.findById(token.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isVerified = true;
    await user.save();
    await token.deleteOne();
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};