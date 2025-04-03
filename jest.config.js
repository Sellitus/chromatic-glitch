/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
};
