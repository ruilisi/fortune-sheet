import _ from "lodash";
import { Context } from "../context";
import { CellMatrix, CellWithRowAndCol, Sheet } from "../types";
import { getSheetIndex } from "../utils";
import { SHEET_NOT_FOUND } from "./errors";

export type CommonOptions = { index?: number; id?: string };

export const dataToCelldata = (data: CellMatrix | undefined) => {
  const celldata: CellWithRowAndCol[] = [];
  if (data == null) {
    return celldata;
  }
  for (let r = 0; r < data.length; r += 1) {
    for (let c = 0; c < data[r].length; c += 1) {
      const v = data[r][c];
      if (v != null) {
        celldata.push({ r, c, v });
      }
    }
  }
  return celldata;
};

export function getSheet(ctx: Context, options: CommonOptions = {}) {
  const { index = getSheetIndex(ctx, options.id || ctx.currentSheetId) } =
    options;

  if (index == null) {
    throw SHEET_NOT_FOUND;
  }

  const sheet = ctx.luckysheetfile[index];

  if (sheet == null) {
    throw SHEET_NOT_FOUND;
  }

  return sheet;
}

export function getSheetWithLatestCelldata(
  ctx: Context,
  options: CommonOptions = {}
) {
  const sheet = getSheet(ctx, options);
  return { ...sheet, celldata: dataToCelldata(sheet.data) };
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
    }) &&
    (ctx.allowEdit || true)
  );
}
