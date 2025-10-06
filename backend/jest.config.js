/**
 * Jest configuration for backend tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test match patterns
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],

  // Run tests in band (sequentially) to avoid port conflicts
  maxWorkers: 1,

  // Coverage configuration
  collectCoverageFrom: ['src/**/*.js', '!src/index.js', '!src/**/*.test.js'],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Timeout for long-running tests
  testTimeout: 30000,
};
