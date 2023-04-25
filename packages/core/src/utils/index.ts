import _ from "lodash";
import { Context } from "../context";
import { locale } from "../locale";
import { Sheet } from "../types";

export * from "./patch";

export function generateRandomSheetName(
  file: Sheet[],
  isPivotTable: boolean,
  ctx: Context
) {
  let index = file.length;

  const locale_pivotTable = locale(ctx).pivotTable;
  const { title } = locale_pivotTable;

  for (let i = 0; i < file.length; i += 1) {
    if (
      file[i].name.indexOf("Sheet") > -1 ||
      file[i].name.indexOf(title) > -1
    ) {
      const suffix = parseFloat(
        file[i].name.replace("Sheet", "").replace(title, "")
      );

      if (!Number.isNaN(suffix) && Math.ceil(suffix) > index) {
        index = Math.ceil(suffix);
      }
    }
  }

  if (isPivotTable) {
    return title + (index + 1);
  }
  return `Sheet${index + 1}`;
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

export function escapeHTMLTag(str: string) {
  if (typeof str !== "string") return str;
  if (str.substr(0, 5) === "<span" || str.startsWith("=")) {
    return str;
  }
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function getSheetIndex(ctx: Context, id: string) {
  for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
    if (ctx.luckysheetfile[i]?.id === id) {
      return i;
    }
  }
  return null;
}

export function getSheetIdByName(ctx: Context, name: string) {
  for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
    if (ctx.luckysheetfile[i].name === name) {
      return ctx.luckysheetfile[i].id;
    }
  }
  return null;
}

export function getSheetByIndex(ctx: Context, id: string) {
  if (_.isNil(id)) {
    id = ctx.currentSheetId;
  }
  const i = getSheetIndex(ctx, id);
  if (_.isNil(i)) {
    return null;
  }
  return ctx.luckysheetfile[i];
}

// 获取当前日期时间
export function getNowDateTime(format: number) {
  const now = new Date();
  const year = now.getFullYear(); // 得到年份
  let month: string | number = now.getMonth(); // 得到月份
  let date: string | number = now.getDate(); // 得到日期
  let hour: string | number = now.getHours(); // 得到小时
  let minu: string | number = now.getMinutes(); // 得到分钟
  let sec: string | number = now.getSeconds(); // 得到秒

  month += 1;
  if (month < 10) month = `0${month}`;
  if (date < 10) date = `0${date}`;
  if (hour < 10) hour = `0${hour}`;
  if (minu < 10) minu = `0${minu}`;
  if (sec < 10) sec = `0${sec}`;

  let time = "";

  // 日期
  if (format === 1) {
    time = `${year}-${month}-${date}`;
  }
  // 日期时间
  else if (format === 2) {
    time = `${year}-${month}-${date} ${hour}:${minu}:${sec}`;
  }

  return time;
}

// 替换temp中的${xxx}为指定内容 ,temp:字符串，这里指html代码，dataarry：一个对象{"xxx":"替换的内容"}
// 例：luckysheet.replaceHtml("${image}",{"image":"abc","jskdjslf":"abc"})   ==>  abc
export function replaceHtml(temp: string, dataarry: any) {
  return temp.replace(/\$\{([\w]+)\}/g, (s1, s2) => {
    const s = dataarry[s2];
    if (typeof s !== "undefined") {
      return s;
    }
    return s1;
  });
}

// 获取正则字符串（处理 . * ? ~* ~?）
export function getRegExpStr(str: string) {
  return str
    .replace("~*", "\\*")
    .replace("~?", "\\?")
    .replace(".", "\\.")
    .replace("*", ".*")
    .replace("?", ".");
}

// 列下标  数字转字母
export function chatatABC(n: number) {
  // let wordlen = columeHeader_word.length;

  // if (index < wordlen) {
  //     return columeHeader_word[index];
  // }
  // else {
  //     let last = 0, pre = 0, ret = "";
  //     let i = 1, n = 0;

  //     while (index >= (wordlen / (wordlen - 1)) * (Math.pow(wordlen, i++) - 1)) {
  //         n = i;
  //     }

  //     let index_ab = index - (wordlen / (wordlen - 1)) * (Math.pow(wordlen, n - 1) - 1);//970
  //     last = index_ab + 1;

  //     for (let x = n; x > 0; x--) {
  //         let last1 = last, x1 = x;//-702=268, 3

  //         if (x == 1) {
  //             last1 = last1 % wordlen;

  //             if (last1 == 0) {
  //                 last1 = 26;
  //             }

  //             return ret + columeHeader_word[last1 - 1];
  //         }

  //         last1 = Math.ceil(last1 / Math.pow(wordlen, x - 1));
  //         //last1 = last1 % wordlen;
  //         ret += columeHeader_word[last1 - 1];

  //         if (x > 1) {
  //             last = last - (last1 - 1) * wordlen;
  //         }
  //     }
  // }

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

export function isAllowEdit(
  ctx: Context,
  range?: Sheet["luckysheet_select_save"]
) {
  const cfg = ctx.config;
  const judgeRange = _.isUndefined(range) ? ctx.luckysheet_select_save : range;
  return (
    _.every(judgeRange, (selection) => {
      for (let r = selection.row[0]; r <= selection.row[1]; r += 1) {
        if (cfg.rowReadOnly?.[r]) {
          return false;
        }
      }
      for (let c = selection.column[0]; c <= selection.column[1]; c += 1) {
        if (cfg.colReadOnly?.[c]) {
          return false;
        }
      }
      return true;
    }) && (_.isUndefined(ctx.allowEdit) ? true : ctx.allowEdit)
  );
}
