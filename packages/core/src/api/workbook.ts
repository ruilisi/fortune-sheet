import _ from "lodash";
import { Context, Sheet, getSheetIndex } from "..";
import {
  addSheet as addSheetInternal,
  deleteSheet as deleteSheetInternal,
  updateSheet as updateSheetInternal,
} from "../modules";
import { Settings } from "../settings";
import { CommonOptions, getSheet } from "./common";
import { INVALID_PARAMS } from "./errors";

export function addSheet(
  ctx: Context,
  settings?: Required<Settings>,
  newSheetID?: string,
  isPivotTable: boolean = false,
  sheetname: string | undefined = undefined,
  sheetData: Sheet | undefined = undefined
) {
  addSheetInternal(
    ctx,
    settings,
    newSheetID,
    isPivotTable,
    sheetname,
    sheetData
  );
}

export function deleteSheet(ctx: Context, options: CommonOptions = {}) {
  const sheet = getSheet(ctx, options);
  deleteSheetInternal(ctx, sheet.id!);
}

export function updateSheet(ctx: Context, data: Sheet[]) {
  updateSheetInternal(ctx, data);
}

export function activateSheet(ctx: Context, options: CommonOptions = {}) {
  const sheet = getSheet(ctx, options);
  ctx.currentSheetId = sheet.id!;
}

export function setSheetName(
  ctx: Context,
  name: string,
  options: CommonOptions = {}
) {
  const sheet = getSheet(ctx, options);
  sheet.name = name;
}

export function setSheetOrder(ctx: Context, orderList: Record<string, number>) {
  ctx.luckysheetfile?.forEach((sheet) => {
    if (sheet.id! in orderList) {
      sheet.order = orderList[sheet.id!];
    }
  });
  // re-order starting from 0
  _.sortBy(ctx.luckysheetfile, ["order"]).forEach((sheet, i) => {
    sheet.order = i;
  });
}

export function scroll(
  ctx: Context,
  scrollbarX: HTMLDivElement | null,
  scrollbarY: HTMLDivElement | null,
  options: {
    scrollLeft?: number;
    scrollTop?: number;
    targetRow?: number;
    targetColumn?: number;
  },
  commonOptions: CommonOptions = {}
) {
  let sheetId: string | undefined;
  let scrollLeft: number | undefined;
  let scrollTop: number | undefined;
  try {
    const sheet = getSheet(ctx, commonOptions);
    sheetId = sheet.id;
  } catch (e) {
    sheetId = ctx.currentSheetId;
  }
  if (options.scrollLeft != null) {
    if (!_.isNumber(options.scrollLeft)) {
      throw INVALID_PARAMS;
    }
    if (scrollbarX && sheetId === ctx.currentSheetId) {
      scrollbarX.scrollLeft = options.scrollLeft;
    } else {
      scrollLeft = options.scrollLeft;
    }
  } else if (options.targetColumn != null) {
    if (!_.isNumber(options.targetColumn)) {
      throw INVALID_PARAMS;
    }
    const col_pre =
      options.targetColumn <= 0
        ? 0
        : ctx.visibledatacolumn[options.targetColumn - 1];
    if (scrollbarX && sheetId === ctx.currentSheetId) {
      scrollbarX.scrollLeft = col_pre;
    } else {
      scrollLeft = col_pre;
    }
  }

  if (options.scrollTop != null) {
    if (!_.isNumber(options.scrollTop)) {
      throw INVALID_PARAMS;
    }
    if (scrollbarY && sheetId === ctx.currentSheetId) {
      scrollbarY.scrollTop = options.scrollTop;
    } else {
      scrollTop = options.scrollTop;
    }
  } else if (options.targetRow != null) {
    if (!_.isNumber(options.targetRow)) {
      throw INVALID_PARAMS;
    }
    const row_pre =
      options.targetRow <= 0 ? 0 : ctx.visibledatarow[options.targetRow - 1];

    if (scrollbarY && sheetId === ctx.currentSheetId) {
      scrollbarY.scrollTop = row_pre;
    } else {
      scrollTop = row_pre;
    }
    if (scrollLeft && scrollTop && sheetId && sheetId !== ctx.currentSheetId) {
      ctx.sheetScrollRecord[sheetId] = {
        ...ctx.sheetScrollRecord[sheetId],
        scrollLeft,
        scrollTop,
      };
    }
  }
}

export function getActiveSheet(ctx: Context) {
  return [getSheetIndex(ctx, ctx.currentSheetId), ctx.currentSheetId];
}
