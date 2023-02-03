import _ from "lodash";
import { getdatabyselection } from "./cell";

import { Context, getFlowdata } from "../context";
import {
  colLocation,
  colLocationByIndex,
  mousePosition,
  rowLocation,
  rowLocationByIndex,
} from "./location";
import { hasPartMC } from "./validation";
import { locale } from "../locale";
import { getBorderInfoCompute } from "./border";
import { normalizeSelection } from "./selection";
import { getSheetIndex } from "../utils";
import { cfSplitRange } from "./conditionalFormat";
import { GlobalCache } from "../types";
import { jfrefreshgrid } from "./refresh";

const dragCellThreshold = 8;

function getCellLocationByMouse(
  ctx: Context,
  e: MouseEvent,
  scrollbarX: HTMLDivElement,
  scrollbarY: HTMLDivElement,
  container: HTMLDivElement
) {
  const rect = container.getBoundingClientRect();
  const x = e.pageX - rect.left - ctx.rowHeaderWidth + scrollbarX.scrollLeft;
  const y = e.pageY - rect.top - ctx.columnHeaderHeight + scrollbarY.scrollTop;

  return {
    row: rowLocation(y, ctx.visibledatarow),
    column: colLocation(x, ctx.visibledatacolumn),
  };
}

export function onCellsMoveStart(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  scrollbarX: HTMLDivElement,
  scrollbarY: HTMLDivElement,
  container: HTMLDivElement
) {
  // if (isEditMode() || ctx.allowEdit === false) {
  if (ctx.allowEdit === false) {
    // 此模式下禁用选区拖动
    return;
  }

  globalCache.dragCellStartPos = { x: e.pageX, y: e.pageY };
  ctx.luckysheet_cell_selected_move = true;
  ctx.luckysheet_scroll_status = true;

  let {
    row: [row_pre, row, row_index],
    column: [col_pre, col, col_index],
  } = getCellLocationByMouse(ctx, e, scrollbarX, scrollbarY, container);

  const range = _.last(ctx.luckysheet_select_save);
  if (range == null) return;

  if (row_index < range.row[0]) {
    [row_index] = range.row;
  } else if (row_index > range.row[1]) [, row_index] = range.row;
  if (col_index < range.column[0]) {
    [col_index] = range.column;
  } else if (col_index > range.column[1]) [, col_index] = range.column;
  [row_pre, row] = rowLocationByIndex(row_index, ctx.visibledatarow);
  [col_pre, col] = colLocationByIndex(col_index, ctx.visibledatacolumn);

  ctx.luckysheet_cell_selected_move_index = [row_index, col_index];

  const ele = document.getElementById("fortune-cell-selected-move");
  if (ele == null) return;
  ele.style.left = `${col_pre}px`;
  ele.style.top = `${row_pre}px`;
  ele.style.width = `${col - col_pre - 1}px`;
  ele.style.height = `${row - row_pre - 1}px`;
  ele.style.display = "block";

  e.stopPropagation();
}

export function onCellsMove(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  scrollbarX: HTMLDivElement,
  scrollbarY: HTMLDivElement,
  container: HTMLDivElement
) {
  if (!ctx.luckysheet_cell_selected_move) return;
  if (globalCache.dragCellStartPos != null) {
    const deltaX = Math.abs(globalCache.dragCellStartPos.x - e.pageX);
    const deltaY = Math.abs(globalCache.dragCellStartPos.y - e.pageY);
    if (deltaX < dragCellThreshold && deltaY < dragCellThreshold) {
      return;
    }
    globalCache.dragCellStartPos = undefined;
  }
  const [x, y] = mousePosition(e.pageX, e.pageY, ctx);

  const rect = container.getBoundingClientRect();
  const winH = rect.height - 20 * ctx.zoomRatio;
  const winW = rect.width - 60 * ctx.zoomRatio;

  const { row: rowL, column } = getCellLocationByMouse(
    ctx,
    e,
    scrollbarX,
    scrollbarY,
    container
  );
  let [row_pre, row] = rowL;
  let [col_pre, col] = column;
  const row_index = rowL[2];
  const col_index = column[2];

  const row_index_original = ctx.luckysheet_cell_selected_move_index[0];
  const col_index_original = ctx.luckysheet_cell_selected_move_index[1];
  if (ctx.luckysheet_select_save == null) return;
  let row_s =
    ctx.luckysheet_select_save[0].row[0] - row_index_original + row_index;
  let row_e =
    ctx.luckysheet_select_save[0].row[1] - row_index_original + row_index;

  let col_s =
    ctx.luckysheet_select_save[0].column[0] - col_index_original + col_index;
  let col_e =
    ctx.luckysheet_select_save[0].column[1] - col_index_original + col_index;

  if (row_s < 0 || y < 0) {
    row_s = 0;
    row_e =
      ctx.luckysheet_select_save[0].row[1] -
      ctx.luckysheet_select_save[0].row[0];
  }

  if (col_s < 0 || x < 0) {
    col_s = 0;
    col_e =
      ctx.luckysheet_select_save[0].column[1] -
      ctx.luckysheet_select_save[0].column[0];
  }

  if (row_e >= ctx.visibledatarow.length - 1 || y > winH) {
    row_s =
      ctx.visibledatarow.length -
      1 -
      ctx.luckysheet_select_save[0].row[1] +
      ctx.luckysheet_select_save[0].row[0];
    row_e = ctx.visibledatarow.length - 1;
  }

  if (col_e >= ctx.visibledatacolumn.length - 1 || x > winW) {
    col_s =
      ctx.visibledatacolumn.length -
      1 -
      ctx.luckysheet_select_save[0].column[1] +
      ctx.luckysheet_select_save[0].column[0];
    col_e = ctx.visibledatacolumn.length - 1;
  }

  col_pre = col_s - 1 === -1 ? 0 : ctx.visibledatacolumn[col_s - 1];
  col = ctx.visibledatacolumn[col_e];
  row_pre = row_s - 1 === -1 ? 0 : ctx.visibledatarow[row_s - 1];
  row = ctx.visibledatarow[row_e];

  const ele = document.getElementById("fortune-cell-selected-move");
  if (ele == null) return;
  ele.style.left = `${col_pre}px`;
  ele.style.top = `${row_pre}px`;
  ele.style.width = `${col - col_pre - 2}px`;
  ele.style.height = `${row - row_pre - 2}px`;
  ele.style.display = "block";
}

export function onCellsMoveEnd(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  scrollbarX: HTMLDivElement,
  scrollbarY: HTMLDivElement,
  container: HTMLDivElement
) {
  // 改变选择框的位置并替换目标单元格
  if (!ctx.luckysheet_cell_selected_move) return;
  ctx.luckysheet_cell_selected_move = false;
  const ele = document.getElementById("fortune-cell-selected-move");
  if (ele != null) ele.style.display = "none";
  if (globalCache.dragCellStartPos != null) {
    globalCache.dragCellStartPos = undefined;
    return;
  }

  const [x, y] = mousePosition(e.pageX, e.pageY, ctx);

  // if (
  //   !checkProtectionLockedRangeList(
  //     ctx.luckysheet_select_save,
  //     ctx.currentSheetIndex
  //   )
  // ) {
  //   return;
  // }

  const rect = container.getBoundingClientRect();
  const winH = rect.height - 20 * ctx.zoomRatio;
  const winW = rect.width - 60 * ctx.zoomRatio;

  const {
    row: [, , row_index],
    column: [, , col_index],
  } = getCellLocationByMouse(ctx, e, scrollbarX, scrollbarY, container);

  const row_index_original = ctx.luckysheet_cell_selected_move_index[0];
  const col_index_original = ctx.luckysheet_cell_selected_move_index[1];

  if (row_index === row_index_original && col_index === col_index_original) {
    return;
  }

  const d = getFlowdata(ctx);
  if (d == null || ctx.luckysheet_select_save == null) return;
  const last =
    ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];

  const data = _.cloneDeep(getdatabyselection(ctx, last, ctx.currentSheetId));

  const cfg = ctx.config;
  if (cfg.merge == null) {
    cfg.merge = {};
  }
  if (cfg.rowlen == null) {
    cfg.rowlen = {};
  }
  const { drag: locale_drag } = locale(ctx);

  // 选区包含部分单元格
  if (
    hasPartMC(
      ctx,
      cfg,
      last.row[0],
      last.row[1],
      last.column[0],
      last.column[1]
    )
  ) {
    // if (isEditMode()) {
    //   alert(locale_drag.noMerge);
    // } else {
    // drag.info(
    //   '<i class="fa fa-exclamation-triangle"></i>',
    throw new Error(locale_drag.noMerge);
    // );
    // }
    // return;
  }

  let row_s = last.row[0] - row_index_original + row_index;
  let row_e = last.row[1] - row_index_original + row_index;
  let col_s = last.column[0] - col_index_original + col_index;
  let col_e = last.column[1] - col_index_original + col_index;

  // if (
  //   !checkProtectionLockedRangeList(
  //     [{ row: [row_s, row_e], column: [col_s, col_e] }],
  //     ctx.currentSheetIndex
  //   )
  // ) {
  //   return;
  // }

  if (row_s < 0 || y < 0) {
    row_s = 0;
    row_e = last.row[1] - last.row[0];
  }

  if (col_s < 0 || x < 0) {
    col_s = 0;
    col_e = last.column[1] - last.column[0];
  }

  if (row_e >= ctx.visibledatarow.length - 1 || y > winH) {
    row_s = ctx.visibledatarow.length - 1 - last.row[1] + last.row[0];
    row_e = ctx.visibledatarow.length - 1;
  }

  if (col_e >= ctx.visibledatacolumn.length - 1 || x > winW) {
    col_s = ctx.visibledatacolumn.length - 1 - last.column[1] + last.column[0];
    col_e = ctx.visibledatacolumn.length - 1;
  }

  // 替换的位置包含部分单元格
  if (hasPartMC(ctx, cfg, row_s, row_e, col_s, col_e)) {
    // if (isEditMode()) {
    //   alert(locale_drag.noMerge);
    // } else {
    // tooltip.info(
    //   '<i class="fa fa-exclamation-triangle"></i>',
    throw new Error(locale_drag.noMerge);
    // );
    // }
    // return;
  }

  const borderInfoCompute = getBorderInfoCompute(ctx, ctx.currentSheetId);

  const hyperLinkList: Record<
    string,
    {
      linkType: string;
      linkAddress: string;
    }
  > = {};
  // 删除原本位置的数据
  // const RowlChange = null;
  const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
  for (let r = last.row[0]; r <= last.row[1]; r += 1) {
    // if (r in cfg.rowlen) {
    //   RowlChange = true;
    // }

    for (let c = last.column[0]; c <= last.column[1]; c += 1) {
      const cellData = d[r][c];

      if (cellData?.mc != null) {
        const mergeKey = `${cellData.mc.r}_${c}`;
        if (cfg.merge[mergeKey] != null) {
          delete cfg.merge[mergeKey];
        }
      }

      d[r][c] = null;
      if (ctx.luckysheetfile[index].hyperlink?.[`${r}_${c}`]) {
        hyperLinkList[`${r}_${c}`] =
          ctx.luckysheetfile[index].hyperlink?.[`${r}_${c}`]!;
        delete ctx.luckysheetfile[
          getSheetIndex(ctx, ctx.currentSheetId) as number
        ].hyperlink?.[`${r}_${c}`];
      }
    }
  }
  // 边框
  if (cfg.borderInfo && cfg.borderInfo.length > 0) {
    const borderInfo = [];

    for (let i = 0; i < cfg.borderInfo.length; i += 1) {
      const bd_rangeType = cfg.borderInfo[i].rangeType;

      if (bd_rangeType === "range") {
        const bd_range = cfg.borderInfo[i].range;
        let bd_emptyRange: any[] = [];
        for (let j = 0; j < bd_range.length; j += 1) {
          bd_emptyRange = bd_emptyRange.concat(
            cfSplitRange(
              bd_range[j],
              { row: last.row, column: last.column },
              { row: [row_s, row_e], column: [col_s, col_e] },
              "restPart"
            )
          );
        }

        cfg.borderInfo[i].range = bd_emptyRange;
        borderInfo.push(cfg.borderInfo[i]);
      } else if (bd_rangeType === "cell") {
        const bd_r = cfg.borderInfo[i].value.row_index;
        const bd_c = cfg.borderInfo[i].value.col_index;

        if (
          !(
            bd_r >= last.row[0] &&
            bd_r <= last.row[1] &&
            bd_c >= last.column[0] &&
            bd_c <= last.column[1]
          )
        ) {
          borderInfo.push(cfg.borderInfo[i]);
        }
      }
    }

    cfg.borderInfo = borderInfo;
  }
  // 替换位置数据更新
  const offsetMC: Record<string, any> = {};
  for (let r = 0; r < data.length; r += 1) {
    for (let c = 0; c < data[0].length; c += 1) {
      if (borderInfoCompute[`${r + last.row[0]}_${c + last.column[0]}`]) {
        const bd_obj = {
          rangeType: "cell",
          value: {
            row_index: r + row_s,
            col_index: c + col_s,
            l: borderInfoCompute[`${r + last.row[0]}_${c + last.column[0]}`].l,
            r: borderInfoCompute[`${r + last.row[0]}_${c + last.column[0]}`].r,
            t: borderInfoCompute[`${r + last.row[0]}_${c + last.column[0]}`].t,
            b: borderInfoCompute[`${r + last.row[0]}_${c + last.column[0]}`].b,
          },
        };

        if (cfg.borderInfo == null) {
          cfg.borderInfo = [];
        }

        cfg.borderInfo.push(bd_obj);
      }

      let value = null;
      if (data[r] != null && data[r][c] != null) {
        value = data[r][c];
      }

      if (value?.mc != null) {
        const mc = _.assign({}, value.mc);
        if ("rs" in value.mc) {
          _.set(offsetMC, `${mc.r}_${mc.c}`, [r + row_s, c + col_s]);

          value.mc.r = r + row_s;
          value.mc.c = c + col_s;

          _.set(cfg.merge, `${r + row_s}_${c + col_s}`, value.mc);
        } else {
          _.set(value.mc, "r", offsetMC[`${mc.r}_${mc.c}`][0]);
          _.set(value.mc, "c", offsetMC[`${mc.r}_${mc.c}`][1]);
        }
      }
      d[r + row_s][c + col_s] = value;
      if (hyperLinkList?.[`${r + last.row[0]}_${c + last.column[0]}`]) {
        ctx.luckysheetfile[index].hyperlink![`${r + row_s}_${c + col_s}`] =
          hyperLinkList?.[`${r + last.row[0]}_${c + last.column[0]}`] as {
            linkType: string;
            linkAddress: string;
          };
      }
    }
  }

  // if (RowlChange) {
  //   cfg = rowlenByRange(d, last.row[0], last.row[1], cfg);
  //   cfg = rowlenByRange(d, row_s, row_e, cfg);
  // }

  // 条件格式
  // const cdformat = $.extend(
  //   true,
  //   [],
  //   ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetIndex)]
  //     .luckysheet_conditionformat_save
  // );
  // if (cdformat != null && cdformat.length > 0) {
  //   for (let i = 0; i < cdformat.length; i += 1) {
  //     const cdformat_cellrange = cdformat[i].cellrange;
  //     let emptyRange = [];
  //     for (let j = 0; j < cdformat_cellrange.length; j += 1) {
  //       const range = conditionformat.CFSplitRange(
  //         cdformat_cellrange[j],
  //         { row: last.row, column: last.column },
  //         { row: [row_s, row_e], column: [col_s, col_e] },
  //         "allPart"
  //       );
  //       emptyRange = emptyRange.concat(range);
  //     }
  //     cdformat[i].cellrange = emptyRange;
  //   }
  // }

  let rf;
  if (
    ctx.luckysheet_select_save[0].row_focus ===
    ctx.luckysheet_select_save[0].row[0]
  ) {
    rf = row_s;
  } else {
    rf = row_e;
  }

  let cf;
  if (
    ctx.luckysheet_select_save[0].column_focus ===
    ctx.luckysheet_select_save[0].column[0]
  ) {
    cf = col_s;
  } else {
    cf = col_e;
  }

  const range = [];
  range.push({ row: last.row, column: last.column });
  range.push({ row: [row_s, row_e], column: [col_s, col_e] });

  last.row = [row_s, row_e];
  last.column = [col_s, col_e];
  last.row_focus = rf;
  last.column_focus = cf;
  ctx.luckysheet_select_save = normalizeSelection(ctx, [last]);
  const sheetIndex = getSheetIndex(ctx, ctx.currentSheetId);
  if (sheetIndex != null) {
    ctx.luckysheetfile[sheetIndex].config = _.assign({}, cfg);
  }

  // const allParam = {
  //   cfg,
  //   RowlChange,
  //   cdformat,
  // };

  jfrefreshgrid(ctx, d, range);

  // selectHightlightShow();

  // $("#luckysheet-sheettable").css("cursor", "default");
  // clearTimeout(ctx.countfuncTimeout);
  // ctx.countfuncTimeout = setTimeout(function () {
  //   countfunc();
  // }, 500);
}
