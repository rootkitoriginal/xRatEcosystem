/**
 * API Version Manager Middleware
 *
 * Handles version routing, deprecation warnings, and version negotiation.
 */

const logger = require('../config/logger');
const versionConfig = require('./versions');

/**
 * Create version middleware that adds deprecation headers
 * @param {string} version - API version (e.g., 'v1')
 * @returns {Function} Express middleware
 */
function createVersionMiddleware(version) {
  return (req, res, next) => {
    // Add API version to response headers
    res.setHeader('X-API-Version', version);

    // Check if version is deprecated
    if (versionConfig.deprecatedVersions.includes(version)) {
      res.setHeader('X-API-Deprecated', 'true');
      res.setHeader(
        'X-API-Deprecation-Info',
        `API ${version} is deprecated. Please migrate to ${versionConfig.defaultVersion}.`
      );
      logger.warn('Deprecated API version accessed', {
        version,
        path: req.path,
        ip: req.ip,
      });
    }

    // Check if version is sunset
    if (versionConfig.sunsetVersions[version]) {
      const sunsetInfo = versionConfig.sunsetVersions[version];
      res.setHeader('X-API-Sunset', sunsetInfo.sunsetDate);
      res.setHeader('X-API-Sunset-Info', sunsetInfo.message);
      logger.warn('Sunset API version accessed', {
        version,
        path: req.path,
        sunsetDate: sunsetInfo.sunsetDate,
        ip: req.ip,
      });
    }

    next();
  };
}

/**
 * Initialize API version routing
 * @param {Object} app - Express app instance
 * @param {Object} routers - Object containing version routers { v1: router, v2: router }
 */
function setupVersionRouting(app, routers) {
  // Add version info endpoint
  app.get('/api/versions', (req, res) => {
    const versionsInfo = Object.keys(versionConfig.metadata).map((version) => {
      const meta = versionConfig.metadata[version];
      const isDeprecated = versionConfig.deprecatedVersions.includes(version);
      const isSunset = !!versionConfig.sunsetVersions[version];
      const isDefault = version === versionConfig.defaultVersion;

      return {
        version,
        ...meta,
        isDefault,
        isDeprecated,
        isSunset,
        sunsetInfo: versionConfig.sunsetVersions[version] || null,
        endpoint: `/api/${version}`,
      };
    });

    res.json({
      success: true,
      defaultVersion: versionConfig.defaultVersion,
      supportedVersions: versionConfig.versions,
      versions: versionsInfo,
    });
  });

  // Mount each version with its middleware
  versionConfig.versions.forEach((version) => {
    const router = routers[version];
    if (router) {
      // Apply version-specific middleware
      app.use(`/api/${version}`, createVersionMiddleware(version), router);
      logger.info(`API ${version} mounted at /api/${version}`);
    } else {
      logger.warn(`Router for API ${version} not found`);
    }
  });

  // Default version routing (optional - redirect /api to /api/v1)
  app.get('/api', (req, res) => {
    res.redirect(`/api/${versionConfig.defaultVersion}`);
  });

  logger.info('API version routing initialized', {
    versions: versionConfig.versions,
    default: versionConfig.defaultVersion,
  });
}

module.exports = {
  createVersionMiddleware,
  setupVersionRouting,
  versionConfig,
};
