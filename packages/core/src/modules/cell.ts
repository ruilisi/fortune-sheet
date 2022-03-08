import _ from "lodash";
import { rgbToHex } from "../utils";
import { isInlineStringCell, isInlineStringCT } from "./inline-string";

export function normalizedCellAttr(cell: any, attr: string): any {
  const tf = { bl: 1, it: 1, ff: 1, cl: 1, un: 1 };
  let value: any = cell?.[attr];

  if (attr in tf || (attr === "fs" && isInlineStringCell(cell))) {
    value ||= "0";
  } else if (["fc", "bg", "bc"].includes(attr)) {
    if (["fc", "bc"].includes(attr)) {
      value ||= "#000000";
    }
    if (value?.indexOf("rgba") > -1) {
      value = rgbToHex(value);
    }
  } else if (attr.substring(0, 2) === "bs") {
    value ||= "none";
  } else if (attr === "ht" || attr === "vt") {
    const defaultValue = attr === "ht" ? "1" : "0";
    value ||= defaultValue;
    if (["0", "1", "2"].indexOf(value.toString()) === -1) {
      value = defaultValue;
    }
  } else if (attr === "fs") {
    value ||= "10";
  } else if (attr === "tb" || attr === "tr") {
    value ||= "0";
  }

  return value;
}

export function normalizedAttr(
  data: any,
  r: number,
  c: number,
  attr: string
): any {
  if (!data || !data[r]) {
    console.warn("cell (%d, %d) is null", r, c);
    return null;
  }
  const cell = data[r][c];
  return normalizedCellAttr(cell, attr);
}

export function getCellValue(r: number, c: number, data: any, attr?: string) {
  if (!attr) {
    attr = "v";
  }

  let d_value;

  if (r !== null && c !== null) {
    d_value = data[r][c];
  } else if (r !== null) {
    d_value = data[r];
  } else if (c !== null) {
    const newData = data[0].map((col: any, i: number) => {
      return data.map((row: any) => {
        return row[i];
      });
    });
    d_value = newData[c];
  } else {
    return data;
  }

  let retv = d_value;

  if (_.isPlainObject(d_value)) {
    retv = d_value[attr];

    if (attr === "f" && retv !== null) {
      // retv = formula.functionHTMLGenerate(retv);
    } else if (attr === "f") {
      retv = d_value.v;
    } else if (d_value && d_value.ct && d_value.ct.t === "d") {
      retv = d_value.m;
    }
  }

  if (retv === undefined) {
    retv = null;
  }

  return retv;
}

export function getRealCellValue(
  r: number,
  c: number,
  data: any,
  attr?: string
) {
  let value = getCellValue(r, c, data, "m");
  if (value === null) {
    value = getCellValue(r, c, data, attr);
    if (value === null) {
      const ct = getCellValue(r, c, data, "ct");
      if (isInlineStringCT(ct)) {
        value = ct.s;
      }
    }
  }

  return value;
}
