import _ from "lodash";
import { Context } from "../context";
import {
  delFunctionGroup,
  dropCellCache,
  functionHTMLGenerate,
  getTypeItemHide,
  setCellValue as setCellValueInternal,
  updateCell,
  updateDropCell,
  updateFormatCell,
} from "../modules";
import { Cell, CellStyle, SingleRange } from "../types";
import { CommonOptions, getSheet } from "./common";
import { SHEET_NOT_FOUND } from "./errors";
// @ts-ignore
import SSF from "../modules/ssf";

export function getCellValue(
  ctx: Context,
  row: number,
  column: number,
  options: CommonOptions & { type?: keyof Cell } = {}
) {
  if (!_.isNumber(row) || !_.isNumber(column)) {
    throw new Error("row or column cannot be null or undefined");
  }
  const sheet = getSheet(ctx, options);
  const { type = "v" } = options;
  const targetSheetData = sheet.data;
  if (!targetSheetData) {
    throw SHEET_NOT_FOUND;
  }
  const cellData = targetSheetData[row][column];
  let ret;

  if (cellData && _.isPlainObject(cellData)) {
    console.log(row,column,cellData);
    ret = cellData[type];

    if (type === "f" && ret != null) {
      ret = functionHTMLGenerate(ret);
    } else if (type === "f") {
      ret = cellData.v;
    } else if (cellData && cellData.ct && cellData.ct.fa === "yyyy-MM-dd") {
      ret = cellData.m;
    } else if (cellData.ct?.t === "inlineStr") {
      ret = cellData.ct.s.reduce(
        (prev: string, cur: any) => prev + (cur.v ?? ""),
        ""
      );
    }
  }

  if (ret === undefined) {
    ret = null;
  }

  return ret;
}

export function setCellValue(
  ctx: Context,
  row: number,
  column: number,
  value: any,
  cellInput: HTMLDivElement | null,
  options: CommonOptions = {}
) {
  if (!_.isNumber(row) || !_.isNumber(column)) {
    throw new Error("row or column cannot be null or undefined");
  }

  const sheet = getSheet(ctx, options);

  const { data } = sheet;
  // if (data.length === 0) {
  //   data = sheetmanage.buildGridData(file);
  // }

  // luckysheetformula.updatecell(row, column, value);
  const formatList = {
    // ct:1, //celltype,Cell value format: text, time, etc.
    bg: 1, // background,#fff000
    ff: 1, // fontfamily,
    fc: 1, // fontcolor
    bl: 1, // Bold
    it: 1, // italic
    fs: 1, // font size
    cl: 1, // Cancelline, 0 Regular, 1 Cancelline
    un: 1, // underline, 0 Regular, 1 underlines, fonts
    vt: 1, // Vertical alignment, 0 middle, 1 up, 2 down
    ht: 1, // Horizontal alignment,0 center, 1 left, 2 right
    mc: 1, // Merge Cells
    tr: 1, // Text rotation,0: 0、1: 45 、2: -45、3 Vertical text、4: 90 、5: -90
    tb: 1, // Text wrap,0 truncation, 1 overflow, 2 word wrap
    // v: 1, //Original value
    // m: 1, //Display value
    rt: 1, // text rotation angle 0-180 alignment
    // f: 1, //formula
    qp: 1, // quotePrefix, show number as string
  };

  if (value == null || value.toString().length === 0) {
    delFunctionGroup(ctx, row, column);
    setCellValueInternal(ctx, row, column, data, value);
  } else if (value instanceof Object) {
    const curv: Cell = {};
    if (data?.[row]?.[column] == null) {
      data![row][column] = {};
    }
    const cell = data![row][column]!;
    if (value.f != null && value.v == null) {
      curv.f = value.f;
      if (value.ct != null) {
        curv.ct = value.ct;
      }
      updateCell(ctx, row, column, cellInput, curv); // update formula value
    } else {
      if (value.ct != null) {
        curv.ct = value.ct;
      }
      if (value.f != null) {
        curv.f = value.f;
      }
      if (value.v != null) {
        curv.v = value.v;
      } else {
        curv.v = cell.v;
      }
      if (value.m != null) {
        curv.m = value.m;
      }
      delFunctionGroup(ctx, row, column);
      setCellValueInternal(ctx, row, column, data, curv); // update text value
    }
    _.forEach(value, (v, attr) => {
      if (attr in formatList) {
        updateFormatCell(
          ctx,
          data!,
          attr as keyof CellStyle,
          v,
          row,
          row,
          column,
          column
        ); // change range format
      } else {
        // @ts-ignore
        cell[attr] = v;
      }
    });
    data![row][column] = cell;
  } else {
    if (
      value.toString().substr(0, 1) === "=" ||
      value.toString().substr(0, 5) === "<span"
    ) {
      updateCell(ctx, row, column, cellInput, value); // update formula value or convert inline string html to object
    } else {
      delFunctionGroup(ctx, row, column);
      setCellValueInternal(ctx, row, column, data, value);
    }
  }
}

export function clearCell(
  ctx: Context,
  row: number,
  column: number,
  options: CommonOptions = {}
) {
  if (!_.isNumber(row) || !_.isNumber(column)) {
    throw new Error("row or column cannot be null or undefined");
  }

  const sheet = getSheet(ctx, options);

  const cell = sheet.data?.[row]?.[column];

  if (cell && _.isPlainObject(cell)) {
    delete cell.m;
    delete cell.v;

    if (cell.f != null) {
      delete cell.f;
      delFunctionGroup(ctx, row, column, sheet.id);

      delete cell.spl;
    }
  }
}

export function setCellToolTip(
  ctx: Context,
  row: number,
  column: number,
  text:string,
  options: CommonOptions = {}
){
  if (!_.isNumber(row) || !_.isNumber(column)) {
    throw new Error("row or column cannot be null or undefined");
  }
  const sheet = getSheet(ctx, options);
  if(!sheet.tooltip){
    sheet.tooltip={}
  }
  sheet.tooltip[`${row}_${column}`]=text
}

export function removeCellToolTip(
  ctx: Context,
  row: number,
  column: number,
  options: CommonOptions = {}
){
  if (!_.isNumber(row) || !_.isNumber(column)) {
    throw new Error("row or column cannot be null or undefined");
  }
  const sheet = getSheet(ctx, options);
  if(!sheet.tooltip){
    return
  }
  delete sheet.tooltip[`${row}_${column}`]
}

export function setCellFormat(
  ctx: Context,
  row: number,
  column: number,
  attr: keyof Cell,
  value: any,
  options: CommonOptions = {}
) {
  if (!_.isNumber(row) || !_.isNumber(column)) {
    throw new Error("row or column cannot be null or undefined");
  }

  if (!attr) {
    throw new Error("attr cannot be null or undefined");
  }

  const sheet = getSheet(ctx, options);

  const targetSheetData = sheet.data!;
  // if (targetSheetData.length === 0) {
  //   targetSheetData = sheetmanage.buildGridData(sheet);
  // }

  const cellData = targetSheetData?.[row]?.[column] || {};
  const cfg = sheet.config || {};

  // 特殊格式
  if (attr === "ct" && (!value || value.fa == null || value.t == null)) {
    throw new Error(
      "'fa' and 't' should be present in value when attr is 'ct'"
    );
  } else if (attr === "ct" && !_.isNil(cellData.v)) {
    cellData.m = SSF.format(value.fa, cellData.v); // auto generate mask
  }

  // @ts-ignore
  if (attr === "bd") {
    if (cfg.borderInfo == null) {
      cfg.borderInfo = [];
    }

    const borderInfo = {
      rangeType: "range",
      borderType: "border-all",
      color: "#000",
      style: "1",
      range: [
        {
          column: [column, column],
          row: [row, row],
        },
      ],
      ...value,
    };

    cfg.borderInfo.push(borderInfo);
  } else {
    cellData[attr] = value;
  }

  targetSheetData[row][column] = cellData;

  sheet.config = cfg;
  ctx.config = cfg;
}

export function autoFillCell(
  ctx: Context,
  copyRange: SingleRange,
  applyRange: SingleRange,
  direction: "up" | "down" | "left" | "right"
) {
  dropCellCache.copyRange = copyRange;
  dropCellCache.applyRange = applyRange;
  dropCellCache.direction = direction;
  const typeItemHide = getTypeItemHide(ctx);
  if (
    !typeItemHide[0] &&
    !typeItemHide[1] &&
    !typeItemHide[2] &&
    !typeItemHide[3] &&
    !typeItemHide[4] &&
    !typeItemHide[5] &&
    !typeItemHide[6]
  ) {
    dropCellCache.applyType = "0";
  } else {
    dropCellCache.applyType = "1";
  }
  updateDropCell(ctx);
}
