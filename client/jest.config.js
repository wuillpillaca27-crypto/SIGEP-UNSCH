process.env.TZ = "America/Lima";

const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: { customExportConditions: ["node", "node-addons"] },
  transformIgnorePatterns: [
    "node_modules/(?!(msw|@mswjs|rettime|@open-draft|outvariant|headers-polyfill|next)/)",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^msw/node$": "<rootDir>/node_modules/msw/lib/node/index.js",
  },
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "html", "lcov"],
};

module.exports = createJestConfig(customJestConfig);
