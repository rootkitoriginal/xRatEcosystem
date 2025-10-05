const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * JWT authentication middleware
 * Verifies the JWT token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    // Check if authorization header is present and is a string
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not yet valid. Please check your system time.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
