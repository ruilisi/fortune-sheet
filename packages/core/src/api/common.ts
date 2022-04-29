import { Context } from "../context";
import { getSheetIndex } from "../utils";
import { SHEET_NOT_FOUND } from "./errors";

export type CommonOptions = { order?: number };

export function getSheet(ctx: Context, options: CommonOptions = {}) {
  const { order = getSheetIndex(ctx, ctx.currentSheetIndex) } = options;

  if (order == null) {
    throw SHEET_NOT_FOUND;
  }

  const sheet = ctx.luckysheetfile[order];

  if (sheet == null) {
    throw SHEET_NOT_FOUND;
  }

  return sheet;
}
