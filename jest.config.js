/**
 * Jest configuration for root-level smoke tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test match patterns - only smoke tests at root level
  testMatch: ['<rootDir>/__tests__/smoke/**/*.test.js'],

  // Coverage configuration
  collectCoverageFrom: ['bin/**/*.js'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/backend/', '/frontend/'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,
};
