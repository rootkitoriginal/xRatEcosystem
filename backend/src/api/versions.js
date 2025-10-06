/**
 * API Version Configuration
 *
 * This file manages all API versions and their configurations.
 * Add new versions here to enable them in the application.
 */

module.exports = {
  // List of supported API versions
  versions: ['v1', 'v2'],

  // Default version when no version is specified
  defaultVersion: 'v1',

  // Deprecated versions (still work but should show deprecation warning)
  deprecatedVersions: [],

  // Sunset versions (will be removed in future, show sunset date)
  sunsetVersions: {
    // Example: 'v1': { sunsetDate: '2026-12-31', message: 'v1 will be discontinued' }
  },

  // Version metadata
  metadata: {
    v1: {
      releaseDate: '2025-10-06',
      description: 'Initial API version with core functionality',
      status: 'stable',
      documentation: '/api-docs/v1',
      features: [
        'Authentication & Authorization',
        'User Management',
        'Data Management',
        'WebSocket Real-time',
        'Rate Limiting',
      ],
    },
    v2: {
      releaseDate: '2026-01-01', // Future version
      description: 'Enhanced API with new features (not yet implemented)',
      status: 'planned',
      documentation: '/api-docs/v2',
      features: [
        'All v1 features',
        'GraphQL support',
        'Batch operations',
        'Advanced filtering',
        'Webhook support',
      ],
    },
  },

  // Version-specific configuration
  config: {
    v1: {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
      },
      features: {
        graphql: false,
        webhooks: false,
        batchOperations: false,
      },
    },
    v2: {
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 150, // Higher limit for v2
      },
      features: {
        graphql: true,
        webhooks: true,
        batchOperations: true,
      },
    },
  },
};
