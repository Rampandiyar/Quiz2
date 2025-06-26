import { body, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

/**
 * Validate request using express-validator
 * @param {Array} validations - Array of validation rules
 * @returns {Array} Middleware array
 */
export const validate = (validations) => {
  return [
    ...validations,
    (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      const extractedErrors = [];
      errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

      throw new AppError('Validation failed', 422, {
        errors: extractedErrors
      });
    }
  ];
};

/**
 * Common validation rules
 */
export const commonValidationRules = {
  email: body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
    
  password: body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
    
  name: body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    
  registrationNumber: body('registrationNumber')
    .trim()
    .notEmpty().withMessage('Registration number is required')
    .isUppercase().withMessage('Registration number must be uppercase')
};

/**
 * Validate object ID
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};