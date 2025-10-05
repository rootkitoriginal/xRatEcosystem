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
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/performance/', // Exclude performance tests from regular runs
  ],
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
    // Progressive threshold for socketService.js (improved from 46.88% to 82.77% statements)
    'src/websocket/socketService.js': {
      branches: 75,
      functions: 68,
      lines: 82,
      statements: 80,
    },
  },
  testTimeout: 10000,
};
