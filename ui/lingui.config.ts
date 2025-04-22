import { lefunExtractor } from "@lefun/ui/lefunExtractor";
import type { LinguiConfig } from "@lingui/conf";

import { game } from "chickenroll-game";

const config: LinguiConfig = {
  locales: ["en"],
  sourceLocale: "en",
  compileNamespace: "es",
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
    },
  ],
  format: "po",
  extractors: [lefunExtractor(game)],
  formatOptions: {
    lineNumbers: false,
  },
};

export default config;
