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
      branches: 53,
      functions: 80,
      lines: 75,
      statements: 75,
    },
    // Specific thresholds for middleware (the focus of this PR)
    'src/middleware/**/*.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testTimeout: 10000,
};
