module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 15000,
  setupFiles: ['./tests/helpers/setup.js'],
  maxWorkers: 1
};
