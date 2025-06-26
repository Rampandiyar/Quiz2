import bcrypt from 'bcryptjs';
import { AppError } from './errorHandler.js';

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new AppError('Error hashing password', 500);
  }
};

/**
 * Compare passwords
 * @param {string} candidatePassword - Plain text password
 * @param {string} userPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePasswords = async (candidatePassword, userPassword) => {
  try {
    return await bcrypt.compare(candidatePassword, userPassword);
  } catch (error) {
    throw new AppError('Error comparing passwords', 500);
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @throws {AppError} If password is weak
 */
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    throw new AppError(`Password must be at least ${minLength} characters long`, 400);
  }
  if (!hasUpperCase) {
    throw new AppError('Password must contain at least one uppercase letter', 400);
  }
  if (!hasLowerCase) {
    throw new AppError('Password must contain at least one lowercase letter', 400);
  }
  if (!hasNumbers) {
    throw new AppError('Password must contain at least one number', 400);
  }
  if (!hasSpecialChars) {
    throw new AppError('Password must contain at least one special character', 400);
  }
};