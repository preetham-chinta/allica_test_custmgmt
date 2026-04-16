/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  setupFiles: ["<rootDir>/src/__tests__/polyfills.js"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.js"],
  transform: { "^.+\\.(js|jsx|mjs)$": "babel-jest" },
  moduleFileExtensions: ["js", "jsx", "mjs", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less)$": "<rootDir>/src/__tests__/stubs/style.js",
    "\\.(png|jpg|svg|ico)$": "<rootDir>/src/__tests__/stubs/file.js",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/src/__tests__/setup.js",
    "<rootDir>/src/__tests__/stubs/",
    "<rootDir>/src/__tests__/test-utils.jsx",
    "<rootDir>/src/__tests__/msw/",
  ],
  transformIgnorePatterns: [
    "node_modules/(?!(msw|@mswjs|rettime|undici)/)",
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/index.jsx",
    "!src/__tests__/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: { lines: 80, branches: 75, functions: 80, statements: 80 },
  },
};
