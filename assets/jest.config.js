module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  globals: {
    window: {
      navigator: {
        userAgent: "none",
      },
    },
  },
};
