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
    // Progressive threshold for socketService.js (improved from 26% to 46.88% statements)
    'src/websocket/socketService.js': {
      branches: 35,
      functions: 45,
      lines: 40,
      statements: 40,
    },
  },
  testTimeout: 10000,
};
