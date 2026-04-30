import { lingui } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react({ babel: { plugins: ["@lingui/babel-plugin-lingui-macro"] } }), lingui()],
  test: {
    environment: "jsdom",
  },
  resolve: {
    dedupe: ["react", "react-dom", "@lingui/react"],
    mainFields: ["module", "main"],
  },
});
