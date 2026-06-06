

const config = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/api/**/*.ts',
    '!src/api/client.ts',
    '!src/api/tokenStore.ts',
    '!src/api/index.ts',
    '!src/api/types.ts',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage',
};

module.exports = config;
