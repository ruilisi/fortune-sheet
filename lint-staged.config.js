module.exports = {
  "**/*.json": ["prettier --write"],
  "**/*.{js,jsx,ts,tsx}": ["eslint --fix"],
  "**/*.ts?(x)": () => "tsc --noEmit",
};
