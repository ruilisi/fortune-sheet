const fs = require("fs");
const { spawnSync } = require("child_process");

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


const result = spawnSync("npx", ["father-build"], { 
  stdio: "inherit",
  shell: true
});

if (result.error) {
  console.error("Error running father-build:", result.error);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`father-build failed with exit code ${result.status}`);
  process.exit(result.status);
}

fs.rmSync("packages/core/tsconfig.json");
fs.rmSync("packages/react/tsconfig.json");
