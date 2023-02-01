import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { dataToCelldata, getSheet } from "./common";
import { Context } from "../context";
import { CellMatrix, CellWithRowAndCol, Sheet } from "../types";
import { getSheetIndex } from "../utils";
import { api, execfunction, insertUpdateFunctionGroup, locale } from "..";

export function getAllSheets(ctx: Context) {
  return ctx.luckysheetfile;
}

export { getSheet };

export function initSheetData(
  draftCtx: Context,
  index: number,
  newData: Sheet
): CellMatrix | null {
  const { celldata, row, column } = newData;
  const lastRow = _.maxBy<CellWithRowAndCol>(celldata, "r");
  const lastCol = _.maxBy(celldata, "c");
  let lastRowNum = (lastRow?.r ?? 0) + 1;
  let lastColNum = (lastCol?.c ?? 0) + 1;
  if (row != null && column != null && row > 0 && column > 0) {
    lastRowNum = Math.max(lastRowNum, row);
    lastColNum = Math.max(lastColNum, column);
  } else {
    lastRowNum = Math.max(lastRowNum, draftCtx.defaultrowNum);
    lastColNum = Math.max(lastColNum, draftCtx.defaultcolumnNum);
  }
  if (lastRowNum && lastColNum) {
    const expandedData: Sheet["data"] = _.times(lastRowNum, () =>
      _.times(lastColNum, () => null)
    );
    celldata?.forEach((d) => {
      expandedData[d.r][d.c] = d.v;
    });
    if (draftCtx.luckysheetfile[index] == null) {
      newData.data = expandedData;
      delete newData.celldata;
      draftCtx.luckysheetfile.push(newData);
    } else {
      draftCtx.luckysheetfile[index].data = expandedData;
      delete draftCtx.luckysheetfile[index].celldata;
    }
    return expandedData;
  }
  return null;
}

export function hideSheet(ctx: Context, sheetId: string) {
  const index = getSheetIndex(ctx, sheetId) as number;
  ctx.luckysheetfile[index].hide = 1;
  ctx.luckysheetfile[index].status = 0;
  const shownSheets = ctx.luckysheetfile.filter(
    (sheet) => _.isUndefined(sheet.hide) || sheet?.hide !== 1
  );
  ctx.currentSheetId = shownSheets[0].id as string;
}

export function showSheet(ctx: Context, sheetId: string) {
  const index = getSheetIndex(ctx, sheetId) as number;
  ctx.luckysheetfile[index].hide = undefined;
}

function generateCopySheetName(ctx: Context, sheetId: string) {
  const { info } = locale(ctx);
  const copyWord = `(${info.copy}`;
  const SheetIndex = getSheetIndex(ctx, sheetId) as number;
  let sheetName = ctx.luckysheetfile[SheetIndex].name;
  const copy_i = sheetName.indexOf(copyWord);
  let index: number = 0;

  if (copy_i !== -1) {
    sheetName = sheetName.toString().substring(0, copy_i);
  }

  const nameCopy = sheetName + copyWord;
  const sheetNames = [];

  for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
    const fileName = ctx.luckysheetfile[i].name;
    sheetNames.push(fileName);
    const st_i = fileName.indexOf(nameCopy);

    if (st_i === 0) {
      index = index || 2;
      const ed_i = fileName.indexOf(")", st_i + nameCopy.length);
      const num = fileName.substring(st_i + nameCopy.length, ed_i);

      if (_.isNumber(num)) {
        if (Number.parseInt(num, 10) >= index) {
          index = Number.parseInt(num, 10) + 1;
        }
      }
    }
  }

  let sheetCopyName;

  do {
    const postfix = `${copyWord + (index || "")})`;
    const lengthLimit = 31 - postfix.length;
    sheetCopyName = sheetName;
    if (sheetCopyName.length > lengthLimit) {
      sheetCopyName = `${sheetCopyName.slice(0, lengthLimit - 1)}…`;
    }
    sheetCopyName += postfix;
    index = (index || 1) + 1;
  } while (sheetNames.indexOf(sheetCopyName) !== -1);

  return sheetCopyName;
}

export function copySheet(ctx: Context, sheetId: string) {
  const index = getSheetIndex(ctx, sheetId) as number;
  const order = ctx.luckysheetfile[index].order! + 1;
  const sheetName = generateCopySheetName(ctx, sheetId);
  const sheetData = _.cloneDeep(ctx.luckysheetfile[index]);
  delete sheetData.id;
  delete sheetData.status;
  sheetData.celldata = dataToCelldata(sheetData.data);
  delete sheetData.data;
  api.addSheet(
    ctx,
    undefined,
    uuidv4(),
    ctx.luckysheetfile[index].isPivotTable,
    sheetName,
    sheetData
  );
  const sheetOrderList: Record<string, number> = {};
  sheetOrderList[
    ctx.luckysheetfile[ctx.luckysheetfile.length - 1].id as string
  ] = order;
  api.setSheetOrder(ctx, sheetOrderList);
}

export function calculateSheetFromula(ctx: Context, id: string) {
  const index = getSheetIndex(ctx, id) as number;
  if (!ctx.luckysheetfile[index].data) return;
  for (let r = 0; r < ctx.luckysheetfile[index].data!.length; r += 1) {
    for (let c = 0; c < ctx.luckysheetfile[index].data![r].length; c += 1) {
      if (!ctx.luckysheetfile[index].data![r][c]?.f) {
        continue;
      }
      const result = execfunction(
        ctx,
        ctx.luckysheetfile[index].data![r][c]?.f!,
        r,
        c,
        id
      );
      api.setCellValue(ctx, r, c, result[1], null);
      insertUpdateFunctionGroup(ctx, r, c, id);
    }
  }
}
