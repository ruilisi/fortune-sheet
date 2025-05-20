export default {
  target: "browser",
  cjs: { type: "rollup", lazy: false },
  esm: { type: "rollup" },
  umd: { minFile: true },
  extractCSS: true,
  disableTypeCheck: false,
};
