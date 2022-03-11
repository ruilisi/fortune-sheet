import _ from "lodash";
import { Context } from "../context";
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

export function mergeBorder(
  ctx: Context,
  d: any[][],
  row_index: number,
  col_index: number
) {
  if (d == null || d[row_index] == null) {
    console.warn("Merge info is null", row_index, col_index);
    return null;
  }
  const value = d[row_index][col_index];

  if (_.isPlainObject(value) && "mc" in value) {
    const margeMaindata = value.mc;
    if (margeMaindata == null) {
      console.warn("Merge info is null", row_index, col_index);
      return null;
    }
    col_index = margeMaindata.c;
    row_index = margeMaindata.r;

    if (d[row_index][col_index] == null) {
      console.warn("Main merge Cell info is null", row_index, col_index);
      return null;
    }
    const col_rs = d[row_index][col_index].mc.cs;
    const row_rs = d[row_index][col_index].mc.rs;

    const margeMain = d[row_index][col_index].mc;

    let start_r: number;
    let end_r: number;
    let row: number | undefined;
    let row_pre: number | undefined;
    for (let r = row_index; r < margeMain.rs + row_index; r += 1) {
      if (r === 0) {
        start_r = -1;
      } else {
        start_r = ctx.visibledatarow[r - 1] - 1;
      }

      end_r = ctx.visibledatarow[r];

      if (row_pre === undefined) {
        row_pre = start_r;
        row = end_r;
      } else if (row !== undefined) {
        row += end_r - start_r - 1;
      }
    }

    let start_c: number;
    let end_c: number;
    let col: number | undefined;
    let col_pre: number | undefined;

    for (let c = col_index; c < margeMain.cs + col_index; c += 1) {
      if (c === 0) {
        start_c = 0;
      } else {
        start_c = ctx.visibledatacolumn[c - 1];
      }

      end_c = ctx.visibledatacolumn[c];

      if (col_pre === undefined) {
        col_pre = start_c;
        col = end_c;
      } else if (col !== undefined) {
        col += end_c - start_c;
      }
    }

    return {
      row: [row_pre, row, row_index, row_index + row_rs - 1],
      column: [col_pre, col, col_index, col_index + col_rs - 1],
    };
  }
  return null;
}
