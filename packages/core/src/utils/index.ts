import { Context } from "../context";

// 颜色 rgb转16进制
export function rgbToHex(color: string): string {
  let rgb;

  if (color.indexOf("rgba") > -1) {
    rgb = color.replace("rgba(", "").replace(")", "").split(",");
  } else {
    rgb = color.replace("rgb(", "").replace(")", "").split(",");
  }

  const r = Number(rgb[0]);
  const g = Number(rgb[1]);
  const b = Number(rgb[2]);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// 列下标  数字转字母
export function indexToColumnChar(n: number) {
  const orda = "a".charCodeAt(0);
  const ordz = "z".charCodeAt(0);
  const len = ordz - orda + 1;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode((n % len) + orda) + s;
    n = Math.floor(n / len) - 1;
  }
  return s.toUpperCase();
}

export function escapeScriptTag(str: string) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<script>/g, "&lt;script&gt;")
    .replace(/<\/script>/, "&lt;/script&gt;");
}

export function getSheetIndex(ctx: Context, index: string) {
  for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
    if (ctx.luckysheetfile[i].index === index) {
      return i;
    }
  }
  return null;
}
