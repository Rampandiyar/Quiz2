import jwt from 'jsonwebtoken';
import config from '../config.js';
import Token from '../Models/Token.js';
import { AppError } from './errorHandler.js';

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {Array} roles - User roles
 * @returns {string} JWT token
 */
export const generateToken = (userId, roles) => {
  return jwt.sign(
    { id: userId, roles },
    config.jwt.accessTokenSecret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
export const verifyToken = async (token) => {
  try {
    // Check if token is blacklisted
    const blacklisted = await Token.findOne({ 
      token, 
      type: 'access', 
      blacklisted: true 
    });
    
    if (blacklisted) {
      throw new AppError('Token is no longer valid', 401);
    }
    
    return jwt.verify(token, config.jwt.accessTokenSecret);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.jwt.refreshTokenSecret,
    { expiresIn: config.jwt.refreshTokenExpiry }
  );
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object} Decoded token
 */
export const verifyRefreshToken = async (token) => {
  try {
    // Check if token is blacklisted
    const blacklisted = await Token.findOne({ 
      token, 
      type: 'refresh', 
      blacklisted: true 
    });
    
    if (blacklisted) {
      throw new AppError('Token is no longer valid', 401);
    }
    
    return jwt.verify(token, config.jwt.refreshTokenSecret);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};