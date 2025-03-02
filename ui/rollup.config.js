import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import scss from "rollup-plugin-scss";
import sass from "sass";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    commonjs(),
    nodeResolve(),
    typescript({ tsconfig: "./tsconfig.json" }),
    scss({ sass, fileName: "index.css" }),
  ],
  external: ["@lefun/core", "@lefun/game", "@lefun/ui", "react", "react-redux"],
  exclude: ["src/main.tsx"],
};
