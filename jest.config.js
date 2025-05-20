const { readdirSync } = require("fs");
const { join } = require("path");

const pkgList = readdirSync(join(__dirname, "./packages")).filter(
  (pkg) => pkg.charAt(0) !== "."
);

const moduleNameMapper = {
  "\\.(css|less|sass|scss)$": require.resolve("identity-obj-proxy"),
  uuid: require.resolve("uuid"),
};

pkgList.forEach((shortName) => {
  const name = `@online-sheet/${shortName}`;
  // Workaround for Jest not having ESM support yet
  // See: https://github.com/uuidjs/uuid/issues/451
  moduleNameMapper[name] = join(__dirname, `./packages/${shortName}/src`);
});

module.exports = {
  collectCoverageFrom: ["packages/**/src/**/*.{ts,tsx}"],
  testEnvironment: "jsdom",
  moduleNameMapper,
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  transform: {
    "\\.(t|j)sx?$": require.resolve("./tests/transformer"),
  },
  unmockedModulePathPatterns: ["node_modules/react/", "node_modules/enzyme/"],
  verbose: true,
  setupFiles: ["./tests/setup.js"],
};
