const path = require("node:path");
const { defineConfig } = require("vitest/config");

// Keep date utility results deterministic across developer and CI machines.
process.env.TZ = "America/Lima";

module.exports = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "jsdom",
    reporters: ["verbose"],
    setupFiles: ["./vitest.setup.ts"],
  },
});