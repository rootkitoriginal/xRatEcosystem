const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Get user profile
 * GET /api/users/profile
 */
const getUserProfile = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await User.findById(req.user._id).select(
      '-password -refreshToken'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Get user profile error', {
      requestId: req.requestId,
      userId: req.user?._id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const { fullName, bio, avatarUrl } = req.validatedBody;

    // Find and update user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update only provided fields
    if (fullName !== undefined) {
      user.fullName = fullName;
    }
    if (bio !== undefined) {
      user.bio = bio;
    }
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }

    await user.save();

    logger.info('User profile updated', {
      requestId: req.requestId,
      userId: user._id,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Update user profile error', {
      requestId: req.requestId,
      userId: req.user?._id,
      error: error.message,
      stack: error.stack,
    });

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
