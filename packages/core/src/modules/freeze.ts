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

export function scrollToFrozenRowCol(
  ctx: Context,
  freeze: Freezen | undefined
) {
  const select_save = ctx.luckysheet_select_save;
  if (!select_save) return;

  let row;
  const { row_focus } = select_save[0];
  if (row_focus === select_save[0].row[0]) {
    [, row] = select_save[0].row;
  } else if (row_focus === select_save[0].row[1]) {
    [row] = select_save[0].row;
  }

  let column;
  const { column_focus } = select_save[0];
  if (column_focus === select_save[0].column[0]) {
    [, column] = select_save[0].column;
  } else if (column_focus === select_save[0].column[1]) {
    [column] = select_save[0].column;
  }

  const freezenverticaldata = freeze?.vertical?.freezenverticaldata;
  const freezenhorizontaldata = freeze?.horizontal?.freezenhorizontaldata;

  if (freezenverticaldata != null && column != null) {
    let freezen_colindex = freezenverticaldata[1];

    const offset = _.sortedIndex(freezenverticaldata[3], ctx.scrollLeft);

    const top = freezenverticaldata[4];

    freezen_colindex += offset;

    if (column >= ctx.visibledatacolumn.length) {
      column = ctx.visibledatacolumn.length - 1;
    }

    if (freezen_colindex >= ctx.visibledatacolumn.length) {
      freezen_colindex = ctx.visibledatacolumn.length - 1;
    }

    const column_px = ctx.visibledatacolumn[column];
    const freezen_px = ctx.visibledatacolumn[freezen_colindex];

    if (column_px <= freezen_px + top) {
      ctx.scrollLeft = 0;
      // setTimeout(function () {
      //   $("#luckysheet-scrollbar-x").scrollLeft(0);
      // }, 100);
    }
  }

  if (freezenhorizontaldata != null && row != null) {
    let freezen_rowindex = freezenhorizontaldata[1];

    const offset = _.sortedIndex(freezenhorizontaldata[3], ctx.scrollTop);

    const left = freezenhorizontaldata[4];

    freezen_rowindex += offset;

    if (row >= ctx.visibledatarow.length) {
      row = ctx.visibledatarow.length - 1;
    }

    if (freezen_rowindex >= ctx.visibledatarow.length) {
      freezen_rowindex = ctx.visibledatarow.length - 1;
    }

    const row_px = ctx.visibledatarow[row];
    const freezen_px = ctx.visibledatarow[freezen_rowindex];

    if (row_px <= freezen_px + left) {
      ctx.scrollTop = 0;
      // setTimeout(function () {
      //   $("#luckysheet-scrollbar-y").scrollTop(0);
      // }, 100);
    }
  }
}
