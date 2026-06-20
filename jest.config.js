/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/engine/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Prevent jest from choking on native modules that the tests never import
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@shopify)/)',
  ],
};
