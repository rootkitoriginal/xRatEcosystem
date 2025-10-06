/**
 * API Version 2 Router (PLACEHOLDER)
 *
 * This is a placeholder for future v2 API implementation.
 * v2 will include breaking changes and new features.
 *
 * Planned Features:
 * - GraphQL support
 * - Webhook support
 * - Batch operations
 * - Advanced filtering and sorting
 * - Improved error responses with problem+json format
 * - Better pagination (cursor-based)
 */

const express = require('express');
const router = express.Router();

/**
 * Initialize v2 routes (PLACEHOLDER)
 * @param {Object} _deps - Dependencies object (unused for now)
 * @returns {Router} Express router with v2 routes
 */
function initV2Routes(_deps) {
  // v2 is not yet implemented
  // Return a router that responds with 501 Not Implemented

  router.all('*', (req, res) => {
    res.status(501).json({
      success: false,
      message: 'API v2 is not yet implemented',
      version: 'v2',
      status: 'planned',
      availableVersions: ['v1'],
      migration: {
        from: 'v1',
        to: 'v2',
        documentation: '/docs/API_VERSIONING.md',
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

// Export placeholder routes
module.exports = { initV2Routes };
