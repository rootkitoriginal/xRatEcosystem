# API Versioning Strategy

## Overview

The xRat Ecosystem API uses **URL-based versioning** to maintain backwards compatibility while allowing for breaking changes and new features in future versions.

## Version Format

All API endpoints follow this pattern:

```
/api/{version}/{resource}
```

Examples:

- `/api/v1/users`
- `/api/v1/auth/login`
- `/api/v2/data/batch`

## Supported Versions

### Version 1 (v1) - Current Stable ✅

- **Status**: Stable
- **Release Date**: 2025-10-06
- **Base Path**: `/api/v1`
- **Documentation**: `/api-docs`

**Features**:

- Authentication & Authorization (JWT)
- User Management (CRUD)
- Data Management (CRUD)
- WebSocket Real-time Communication
- Rate Limiting
- Health Checks

**Endpoints**:

- `/api/v1/auth/*` - Authentication routes
- `/api/v1/users/*` - User management
- `/api/v1/data/*` - Data operations
- `/api/v1/health` - Health checks
- `/api/v1/websocket/stats` - WebSocket statistics
- `/api/v1/status` - API status

### Version 2 (v2) - Planned 🚧

- **Status**: Not Implemented (Placeholder)
- **Expected Release**: 2026-Q1
- **Base Path**: `/api/v2`
- **Documentation**: TBD

**Planned Features**:

- All v1 features
- GraphQL endpoint support
- Webhook subscriptions
- Batch operations
- Advanced filtering & sorting
- Cursor-based pagination
- Problem+JSON error format (RFC 7807)

**Breaking Changes from v1**:

- Response format changes
- Error format standardization
- Pagination changes (offset → cursor)

## Version Lifecycle

```
Planning → Beta → Stable → Deprecated → Sunset → Removed
```

### Lifecycle Stages

1. **Planning**: Version is being designed (e.g., v2 currently)
2. **Beta**: Version is available for testing but not production-ready
3. **Stable**: Version is production-ready and fully supported
4. **Deprecated**: Version still works but users should migrate
5. **Sunset**: Version will be removed on a specific date
6. **Removed**: Version is no longer available

## Version Headers

All API responses include version headers:

```http
X-API-Version: v1
```

For deprecated versions:

```http
X-API-Version: v1
X-API-Deprecated: true
X-API-Deprecation-Info: API v1 is deprecated. Please migrate to v2.
```

For sunset versions:

```http
X-API-Version: v1
X-API-Sunset: 2026-12-31
X-API-Sunset-Info: v1 will be discontinued on 2026-12-31
```

## Version Discovery

Get information about all available versions:

```bash
GET /api/versions
```

Response:

```json
{
  "success": true,
  "defaultVersion": "v1",
  "supportedVersions": ["v1", "v2"],
  "versions": [
    {
      "version": "v1",
      "releaseDate": "2025-10-06",
      "description": "Initial API version",
      "status": "stable",
      "isDefault": true,
      "isDeprecated": false,
      "isSunset": false,
      "endpoint": "/api/v1",
      "documentation": "/api-docs/v1",
      "features": [...]
    },
    {
      "version": "v2",
      "releaseDate": "2026-01-01",
      "description": "Enhanced API with new features",
      "status": "planned",
      "isDefault": false,
      "isDeprecated": false,
      "isSunset": false,
      "endpoint": "/api/v2",
      "documentation": "/api-docs/v2",
      "features": [...]
    }
  ]
}
```

## Breaking Changes Policy

### What Constitutes a Breaking Change?

Breaking changes require a new major version. Examples:

- Removing or renaming endpoints
- Changing request/response structure
- Removing or renaming fields
- Changing authentication mechanism
- Changing error response format
- Removing query parameters

### Non-Breaking Changes

These can be added to existing versions:

- Adding new endpoints
- Adding new optional fields to responses
- Adding new optional query parameters
- Adding new error codes (without removing old ones)
- Performance improvements
- Bug fixes

## Migration Guide

### Migrating from v1 to v2 (When Available)

1. **Review Changes**: Read the v2 changelog and breaking changes documentation
2. **Test in Parallel**: Use v2 endpoints in a test environment
3. **Update Client Code**: Update all API calls to use `/api/v2` prefix
4. **Handle New Response Formats**: Adapt to any response structure changes
5. **Deploy**: Roll out changes to production
6. **Monitor**: Watch for errors and performance issues

## Best Practices for API Consumers

### 1. Always Use Explicit Versions

❌ **Don't**: `/api/users` (no version)  
✅ **Do**: `/api/v1/users` (explicit version)

### 2. Monitor Version Headers

Check `X-API-Deprecated` and `X-API-Sunset` headers to stay informed about version lifecycle.

### 3. Plan for Migration

When a version is deprecated, plan migration within the deprecation period (typically 6-12 months).

### 4. Use Version Discovery

Call `/api/versions` to discover available versions and their features.

### 5. Test Against Multiple Versions

Test your application against both current and upcoming versions.

## Deprecation Policy

When we deprecate a version:

1. **Announcement**: At least 6 months notice via:
   - Release notes
   - Email notifications
   - API response headers

2. **Deprecation Period**: Version remains fully functional for 6-12 months

3. **Sunset Warning**: 3 months before removal, sunset headers are added

4. **Removal**: Version is removed after sunset date

## Code Organization

API versions are organized in the codebase:

```
backend/src/api/
├── versions.js           # Version configuration
├── versionManager.js     # Version routing & middleware
├── v1/
│   └── index.js         # v1 routes aggregation
├── v2/
│   └── index.js         # v2 routes (placeholder)
└── v3/
    └── index.js         # Future v3
```

## Adding a New Version

To add v3 (example):

1. **Create Directory**: `backend/src/api/v3/`

2. **Create Router**: `backend/src/api/v3/index.js`

```javascript
const express = require('express');
const router = express.Router();

function initV3Routes(deps) {
  // Add v3 routes here
  return router;
}

module.exports = { initV3Routes };
```

3. **Update Configuration**: `backend/src/api/versions.js`

```javascript
versions: ['v1', 'v2', 'v3'],
metadata: {
  // ... existing metadata
  v3: {
    releaseDate: '2026-06-01',
    description: 'New features...',
    status: 'beta',
    // ...
  }
}
```

4. **Mount in index.js**: `backend/src/index.js`

```javascript
const { initV3Routes } = require('./api/v3');
// ...
const v3Router = initV3Routes({
  /* deps */
});
setupVersionRouting(app, { v1, v2, v3: v3Router });
```

5. **Update OpenAPI Spec**: Create `openapi-v3.yaml`

6. **Update Documentation**: Add migration guide from v2 to v3

## Testing Version Compatibility

Run version-specific tests:

```bash
# Test v1 endpoints
npm test -- --grep "v1"

# Test v2 endpoints
npm test -- --grep "v2"

# Test all versions
npm test
```

## Rollback Strategy

If issues arise after deploying a new version:

1. New version remains available but not recommended
2. Previous version continues as default
3. Investigate and fix issues
4. Re-release new version when stable

## Support Policy

- **Current Stable Version**: Full support, active development
- **Previous Stable Version**: Security updates only for 12 months
- **Deprecated Versions**: No updates, will be removed
- **Beta Versions**: No SLA, may have breaking changes

## Questions?

For questions about API versioning:

- Open an issue on GitHub
- Contact the development team
- Check `/api/versions` endpoint

---

**Last Updated**: 2025-10-06  
**Current Stable Version**: v1  
**Next Version**: v2 (Planned for 2026-Q1)
