module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/**/*.test.js',
    '!src/**/routes.js',
    '!src/**/*Routes.js',
    '!**/node_modules/**',
  ],
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Specific thresholds for middleware
    'src/middleware/**/*.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    // Specific thresholds for websocket validators and authorization (high coverage)
    'src/websocket/validators.js': {
      branches: 96,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    'src/websocket/authorization.js': {
      branches: 90,
      functions: 100,
      lines: 97,
      statements: 97,
    },
    // Lower threshold for socketService.js (large file, needs more test development)
    'src/websocket/socketService.js': {
      branches: 19,
      functions: 26,
      lines: 27,
      statements: 26,
    },
  },
  testTimeout: 10000,
};
