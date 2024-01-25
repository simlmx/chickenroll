import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
  resolve: {
    preserveSymlinks: true,
    dedupe: ["react", "react-dom", "react-redux", "redux"],
    mainFields: ["module", "main"],
  },
});
