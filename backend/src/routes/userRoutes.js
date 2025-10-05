const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate, updateProfileSchema } = require('../utils/validation');

/**
 * User Profile Routes
 * All routes are protected and require authentication
 */

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Protected
 */
router.get('/profile', authenticate, userController.getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Protected
 */
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  userController.updateUserProfile
);

module.exports = router;
