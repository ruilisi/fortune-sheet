export default {
  target: "browser",
  cjs: { type: "rollup", lazy: false },
  esm: { type: "rollup" },
  umd: { globals: { Workbook: "Workbook" }, minFile: true },
  extractCSS: true,
  disableTypeCheck: false,
};
