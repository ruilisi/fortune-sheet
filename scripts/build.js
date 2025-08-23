const fs = require("fs");
const spawn = require('cross-spawn');

const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json"));

delete tsconfig.compilerOptions.paths;
tsconfig.include = ["./src"];
tsconfig.exclude = [
  "node_modules",
  "**/*.test.ts",
  "**/*.spec.ts",
  "dist",
  "lib",
];

const tsconfigJson = JSON.stringify(tsconfig);
fs.writeFileSync("packages/core/tsconfig.json", tsconfigJson);
fs.writeFileSync("packages/react/tsconfig.json", tsconfigJson);

spawn.sync("father-build", { stdio: "inherit" });

fs.rmSync("packages/core/tsconfig.json");
fs.rmSync("packages/react/tsconfig.json");
