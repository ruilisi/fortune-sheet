import _ from "lodash";
import { Context, Freezen, getSheetIndex, GlobalCache } from "..";

function cutVolumn(arr: number[], cutindex: number) {
  if (cutindex <= 0) {
    return arr;
  }
  const ret = arr.slice(cutindex);
  return ret;
}

function frozenTofreezen(ctx: Context, cache: GlobalCache, sheetIndex: string) {
  // get frozen type
  const file = ctx.luckysheetfile[getSheetIndex(ctx, sheetIndex)!];
  const { frozen } = file;

  if (frozen == null) {
    return;
  }

  const freezen: Freezen = {};

  let { range } = frozen;
  if (!range) {
    range = {
      row_focus: 0,
      column_focus: 0,
    };
  }
  let { type } = frozen;
  if (type === "row") {
    type = "rangeRow";
  } else if (type === "column") {
    type = "rangeColumn";
  } else if (type === "both") {
    type = "rangeBoth";
  }

  // transform to freezen
  if (type === "rangeRow" || type === "rangeBoth") {
    const scrollTop = 0;
    let row_st = _.sortedIndex(ctx.visibledatarow, scrollTop);

    const { row_focus } = range;

    if (row_focus > row_st) {
      row_st = row_focus;
    }

    if (row_st === -1) {
      row_st = 0;
    }

    const top =
      ctx.visibledatarow[row_st] - 2 - scrollTop + ctx.columnHeaderHeight;
    const freezenhorizontaldata = [
      ctx.visibledatarow[row_st],
      row_st + 1,
      scrollTop,
      cutVolumn(ctx.visibledatarow, row_st + 1),
      top,
    ];

    freezen.horizontal = {
      freezenhorizontaldata,
      top,
    };
  }
  if (type === "rangeColumn" || type === "rangeBoth") {
    const scrollLeft = 0;
    let col_st = _.sortedIndex(ctx.visibledatacolumn, scrollLeft);

    const { column_focus } = range;

    if (column_focus > col_st) {
      col_st = column_focus;
    }

    if (col_st === -1) {
      col_st = 0;
    }

    const left =
      ctx.visibledatacolumn[col_st] - 2 - scrollLeft + ctx.rowHeaderWidth;
    const freezenverticaldata = [
      ctx.visibledatacolumn[col_st],
      col_st + 1,
      scrollLeft,
      cutVolumn(ctx.visibledatacolumn, col_st + 1),
      left,
    ];

    freezen.vertical = {
      freezenverticaldata,
      left,
    };
  }

  cache.freezen ||= {};
  cache.freezen[ctx.currentSheetIndex] = freezen;
}

export function initFreeze(
  ctx: Context,
  cache: GlobalCache,
  sheetIndex: string
) {
  frozenTofreezen(ctx, cache, sheetIndex);
}
