import { Context } from "../context";
import { getSheetIndex } from "../utils";
import { SHEET_NOT_FOUND } from "./errors";

export type CommonOptions = { index?: number; id?: string };

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
