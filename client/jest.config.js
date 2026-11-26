const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

process.env.TZ = "America/Lima";

const customJestConfig = {
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ["text", "html", "lcov"],
  collectCoverageFrom: ["app/**/*.{ts,tsx}", "!app/**/__tests__/**", "!app/**/*.d.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

module.exports = createJestConfig(customJestConfig);
