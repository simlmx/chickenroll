import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import scss from "rollup-plugin-scss";
import * as sass from "sass";

export default {
  input: { index: "src/index.ts", "locales/en": "src/locales/en/messages.mjs" },
  output: {
    dir: "dist",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    commonjs(),
    nodeResolve(),
    typescript({ tsconfig: "./tsconfig.json" }),
    scss({ sass, fileName: "index.css" }),
    babel({
      babelHelpers: "bundled",
      extensions: [".tsx", ".ts"],
    }),
  ],
  external: [
    //
    "@lefun/core",
    "@lefun/game",
    "@lefun/ui",
    //
    //
    "react",
    "react/jsx-runtime",
    "react-dom",
    //
    "@lingui/react",
  ],
};
