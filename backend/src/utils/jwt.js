const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

/**
 * Generate JWT access token
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE,
  });
};

/**
 * Verify JWT access token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verify JWT refresh token
 * @param {String} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
