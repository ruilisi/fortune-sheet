import { Context } from "../context";
import { CellMatrix, CellWithRowAndCol } from "../types";
import { getSheetIndex } from "../utils";
import { SHEET_NOT_FOUND } from "./errors";

export type CommonOptions = { index?: number; id?: string };

const dataToCelldata = (data: CellMatrix | undefined) => {
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

  return { ...sheet, celldata: dataToCelldata(sheet.data) };
}
