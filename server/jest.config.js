module.exports = {
  verbose: true,
  testEnvironment: "node",
  modulePathIgnorePatterns: ["<rootDir>/.runtime-local/"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "lcov"],
  collectCoverageFrom: ["src/**/*.js", "!src/**/*.test.js"],
};