/**
 * Mock Configuration for Backend
 * Controls whether to use mocks in tests and development environments
 */

// Read environment variables
const USE_BACKEND_MOCKS = process.env.USE_BACKEND_MOCKS === 'true';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Mock configuration settings
const mockConfig = {
  // Global flag to enable/disable mocks
  enabled: USE_BACKEND_MOCKS,
  
  // Environment-specific settings
  environments: {
    test: true,      // Always use mocks in test environment
    development: USE_BACKEND_MOCKS,
    staging: false,  // Never use mocks in staging
    production: false // Never use mocks in production
  },
  
  // Specific mock configurations
  database: {
    mongodb: NODE_ENV === 'test' || (NODE_ENV === 'development' && USE_BACKEND_MOCKS),
    redis: NODE_ENV === 'test' || (NODE_ENV === 'development' && USE_BACKEND_MOCKS)
  },
  
  // External services
  services: {
    email: NODE_ENV === 'test' || (NODE_ENV === 'development' && USE_BACKEND_MOCKS),
    notifications: NODE_ENV === 'test' || (NODE_ENV === 'development' && USE_BACKEND_MOCKS),
    websocket: NODE_ENV === 'test' || (NODE_ENV === 'development' && USE_BACKEND_MOCKS)
  }
};

/**
 * Check if mocks are enabled globally
 */
const isMockEnabled = () => {
  return mockConfig.environments[NODE_ENV] || false;
};

/**
 * Check if database mocks are enabled
 */
const isDatabaseMockEnabled = (service = 'mongodb') => {
  return mockConfig.database[service] || false;
};

/**
 * Check if service mocks are enabled
 */
const isServiceMockEnabled = (service) => {
  return mockConfig.services[service] || false;
};

/**
 * Get mock configuration for specific context
 */
const getMockConfig = (context) => {
  switch (context) {
    case 'database':
      return mockConfig.database;
    case 'services':
      return mockConfig.services;
    case 'global':
    default:
      return {
        enabled: isMockEnabled(),
        environment: NODE_ENV,
        config: mockConfig
      };
  }
};

/**
 * Console warning for mock usage in non-test environments
 */
const warnMockUsage = (component) => {
  if (NODE_ENV !== 'test' && isMockEnabled()) {
    console.warn(`⚠️  [MOCK] Using mock ${component} in ${NODE_ENV} environment. Set USE_BACKEND_MOCKS=false to disable.`);
  }
};

/**
 * Create conditional mock/real implementation
 */
const createConditionalService = (mockImpl, realImpl, serviceName) => {
  if (isServiceMockEnabled(serviceName)) {
    warnMockUsage(serviceName);
    return mockImpl;
  }
  return realImpl;
};

module.exports = {
  mockConfig,
  isMockEnabled,
  isDatabaseMockEnabled,
  isServiceMockEnabled,
  getMockConfig,
  warnMockUsage,
  createConditionalService,
  
  // Convenience flags
  MOCKS_ENABLED: isMockEnabled(),
  IS_TEST_ENV: NODE_ENV === 'test',
  IS_DEV_ENV: NODE_ENV === 'development'
};