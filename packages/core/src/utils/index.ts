import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { Context } from "../context";

export function generateRandomSheetIndex() {
  return uuidv4();
}

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

// 列下标  字母转数字
export function columnCharToIndex(a: string) {
  if (a == null || a.length === 0) {
    return NaN;
  }
  const str = a.toLowerCase().split("");
  const al = str.length;
  const getCharNumber = (charx: string) => {
    return charx.charCodeAt(0) - 96;
  };
  let numout = 0;
  let charnum = 0;
  for (let i = 0; i < al; i += 1) {
    charnum = getCharNumber(str[i]);
    numout += charnum * 26 ** (al - i - 1);
  }
  // console.log(a, numout-1);
  if (numout === 0) {
    return NaN;
  }
  return numout - 1;
}

export function escapeScriptTag(str: string) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<script>/g, "&lt;script&gt;")
    .replace(/<\/script>/, "&lt;/script&gt;");
}

export function getSheetIndex(ctx: Context, index: string | number) {
  for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
    if (ctx.luckysheetfile[i].index?.toString() === index.toString()) {
      return i;
    }
  }
  return null;
}

export function getSheetByIndex(ctx: Context, index: string | number) {
  if (_.isNil(index)) {
    index = ctx.currentSheetIndex;
  }
  const i = getSheetIndex(ctx, index);
  if (_.isNil(i)) {
    return null;
  }
  return ctx.luckysheetfile[i];
}
