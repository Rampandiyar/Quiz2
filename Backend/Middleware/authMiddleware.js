import jwt from 'jsonwebtoken';
import User from '../Models/User.js';
import Token from '../Models/Token.js';
import AppError from '../Utils/errorHandler.js';
import config from '../config.js';

export const authenticate = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.refreshToken) {
      token = req.cookies.refreshToken;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verify token
    const decoded = await jwt.verify(token, config.jwt.accessTokenSecret);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).populate('roles');
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again.', 401)
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return next(new AppError('No refresh token provided', 401));
    }

    // Check if token is blacklisted
    const tokenDoc = await Token.findOne({ 
      token: refreshToken,
      type: 'refresh',
      blacklisted: false
    });
    if (!tokenDoc) {
      return next(new AppError('Invalid refresh token', 403));
    }

    // Verify token
    jwt.verify(refreshToken, config.jwt.refreshTokenSecret, (err, decoded) => {
      if (err) {
        return next(new AppError('Invalid or expired refresh token', 403));
      }
      req.userId = decoded.id;
      next();
    });
  } catch (error) {
    next(error);
  }
};