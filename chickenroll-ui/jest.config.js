const config = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^.+\\.(css|less|scss)$": "identity-obj-proxy",
  },
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
};

export default config;
