import _ from "lodash";
import { getSheet } from "./common";
import { Context } from "../context";
import { CellMatrix, CellWithRowAndCol, Sheet } from "../types";

export function getAllSheets(ctx: Context) {
  return ctx.luckysheetfile;
}

export { getSheet };

export function initSheetData(
  draftCtx: Context,
  index: number,
  cellData?: CellWithRowAndCol[]
): CellMatrix | null {
  const lastRow = _.maxBy<CellWithRowAndCol>(cellData, "r");
  const lastCol = _.maxBy(cellData, "c");
  const lastRowNum = Math.max(lastRow?.r ?? 0, draftCtx.defaultrowNum);
  const lastColNum = Math.max(lastCol?.c ?? 0, draftCtx.defaultcolumnNum);
  if (lastRowNum && lastColNum) {
    const expandedData: Sheet["data"] = _.times(lastRowNum + 1, () =>
      _.times(lastColNum + 1, () => null)
    );
    cellData?.forEach((d) => {
      expandedData[d.r][d.c] = d.v;
    });
    draftCtx.luckysheetfile[index].data = expandedData;
    return expandedData;
  }
  return null;
}
