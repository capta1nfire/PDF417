// filepath: c:\PDF417\jest.config.mjs
export default {
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['jest-canvas-mock'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['js'],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true
};