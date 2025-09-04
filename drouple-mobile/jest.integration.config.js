module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/__tests__/integration/simple-connectivity.test.js',
  ],
  testTimeout: 15000,
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
  collectCoverage: false,
  verbose: true,
};