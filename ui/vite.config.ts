import { lingui } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react({ babel: { plugins: ["macros"] } }), lingui()],
  test: {
    environment: "jsdom",
  },
  resolve: {
    dedupe: ["react", "react-dom", "@lingui/react"],
    mainFields: ["module", "main"],
  },
});
