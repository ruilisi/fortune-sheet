import _ from "lodash";
import type { Sheet as SheetType } from "@fortune-sheet/core/src/types";
import { Context, getFlowdata } from "../context";
import { mergeBorder } from "./cell";
import { formulaCache } from "./formula";

export function normalizeSelection(
  ctx: Context,
  selection: SheetType["luckysheet_select_save"]
) {
  if (!selection) return selection;

  const flowdata = getFlowdata(ctx);
  if (!flowdata) return selection;

  for (let i = 0; i < selection.length; i += 1) {
    const r1 = selection[i].row[0];
    const r2 = selection[i].row[1];
    const c1 = selection[i].column[0];
    const c2 = selection[i].column[1];

    let rf;
    let cf;
    if (_.isNil(selection[i].row_focus)) {
      rf = r1;
    } else {
      rf = selection[i].row_focus;
    }

    if (_.isNil(selection[i].column_focus)) {
      cf = c1;
    } else {
      cf = selection[i].column_focus;
    }

    if (_.isNil(rf) || _.isNil(cf)) {
      console.error("normalizeSelection: rf and cf is nil");
      return selection;
    }

    const row = ctx.visibledatarow[r2];
    const row_pre = r1 - 1 === -1 ? 0 : ctx.visibledatarow[r1 - 1];
    const col = ctx.visibledatacolumn[c2];
    const col_pre = c1 - 1 === -1 ? 0 : ctx.visibledatacolumn[c1 - 1];

    let row_f = ctx.visibledatarow[rf];
    let row_pre_f = rf - 1 === -1 ? 0 : ctx.visibledatarow[rf - 1];
    let col_f = ctx.visibledatacolumn[cf];
    let col_pre_f = cf - 1 === -1 ? 0 : ctx.visibledatacolumn[cf - 1];

    const margeset = mergeBorder(ctx, flowdata, rf, cf);
    if (margeset) {
      [row_pre_f, row_f] = margeset.row;
      [col_pre_f, col_f] = margeset.column;
    }

    selection[i].row = [r1, r2];
    selection[i].column = [c1, c2];

    selection[i].row_focus = rf;
    selection[i].column_focus = cf;

    selection[i].left = col_pre_f;
    selection[i].width = col_f - col_pre_f - 1;
    selection[i].top = row_pre_f;
    selection[i].height = row_f - row_pre_f - 1;

    selection[i].left_move = col_pre;
    selection[i].width_move = col - col_pre - 1;
    selection[i].top_move = row_pre;
    selection[i].height_move = row - row_pre - 1;
  }
  return selection;
}

export function selectTitlesMap(
  rangeMap: Record<string, number>,
  range1: number,
  range2: number
) {
  const map: Record<string, number> = rangeMap || {};
  for (let i = range1; i <= range2; i += 1) {
    if (i in map) {
      continue;
    }
    map[i] = 0;
  }
  return map;
}

export function selectTitlesRange(map: Record<string, number>) {
  const mapArr = Object.keys(map).map(Number);

  mapArr.sort((a, b) => {
    return a - b;
  });

  let rangeArr: number[][] | undefined;
  let item = [];

  if (mapArr.length > 1) {
    rangeArr = [];
    for (let j = 1; j < mapArr.length; j += 1) {
      if (mapArr[j] - mapArr[j - 1] === 1) {
        item.push(mapArr[j - 1]);

        if (j === mapArr.length - 1) {
          item.push(mapArr[j]);
          rangeArr.push(item);
        }
      } else {
        if (j === 1) {
          if (j === mapArr.length - 1) {
            item.push(mapArr[j - 1]);
            rangeArr.push(item);
            rangeArr.push([mapArr[j]]);
          } else {
            rangeArr.push([mapArr[0]]);
          }
        } else if (j === mapArr.length - 1) {
          item.push(mapArr[j - 1]);
          rangeArr.push(item);
          rangeArr.push([mapArr[j]]);
        } else {
          item.push(mapArr[j - 1]);
          rangeArr.push(item);
          item = [];
        }
      }
    }
  } else {
    rangeArr = [];
    rangeArr.push([mapArr[0]]);
  }

  return rangeArr;
}

export function moveHighlightCell(
  ctx: Context,
  postion: "down" | "right",
  index: number,
  type: "rangeOfSelect" | "rangeOfFormula"
) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;
  const datarowlen = flowdata.length;
  const datacolumnlen = flowdata[0].length;

  let row;
  let row_pre;
  let row_index;
  let row_index_ed;
  let col;
  let col_pre;
  let col_index;
  let col_index_ed;

  if (type === "rangeOfSelect") {
    const last =
      ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
    if (!last) {
      console.error("moveHighlightCell: no selection found");
      return;
    }

    let curR;
    if (_.isNil(last.row_focus)) {
      [curR] = last.row;
    } else {
      curR = last.row_focus;
    }

    let curC;
    if (_.isNil(last.column_focus)) {
      [curC] = last.column;
    } else {
      curC = last.column_focus;
    }

    // focus单元格 是否是合并单元格
    const margeset = mergeBorder(ctx, flowdata, curR, curC);
    if (margeset) {
      const str_r = margeset.row[2];
      const end_r = margeset.row[3];

      const str_c = margeset.column[2];
      const end_c = margeset.column[3];

      if (index > 0) {
        if (postion === "down") {
          curR = end_r;
          curC = str_c;
        } else if (postion === "right") {
          curR = str_r;
          curC = end_c;
        }
      } else {
        curR = str_r;
        curC = str_c;
      }
    }

    if (_.isNil(curR) || _.isNil(curC)) {
      console.error("moveHighlightCell: curR or curC is nil");
      return;
    }

    let moveX = _.isNil(last.moveXY) ? curR : last.moveXY.x;
    let moveY = _.isNil(last.moveXY) ? curC : last.moveXY.y;

    if (postion === "down") {
      curR += index;
      moveX = curR;
    } else if (postion === "right") {
      curC += index;
      moveY = curC;
    }

    if (curR >= datarowlen) {
      curR = datarowlen - 1;
      moveX = curR;
    }

    if (curR < 0) {
      curR = 0;
      moveX = curR;
    }

    if (curC >= datacolumnlen) {
      curC = datacolumnlen - 1;
      moveY = curC;
    }

    if (curC < 0) {
      curC = 0;
      moveY = curC;
    }

    // 移动的下一个单元格是否是合并的单元格
    const margeset2 = mergeBorder(ctx, flowdata, curR, curC);
    if (margeset2) {
      [row_pre, row, row_index, row_index_ed] = margeset2.row;
      [col_pre, col, col_index, col_index_ed] = margeset2.column;
    } else {
      row = ctx.visibledatarow[moveX];
      row_pre = moveX - 1 === -1 ? 0 : ctx.visibledatarow[moveX - 1];
      // row_index = moveX;
      // row_index_ed = moveX;

      col = ctx.visibledatacolumn[moveY];
      col_pre = moveY - 1 === -1 ? 0 : ctx.visibledatacolumn[moveY - 1];
      // col_index = moveY;
      // col_index_ed = moveY;

      row_index = curR;
      row_index_ed = curR;
      col_index = curC;
      col_index_ed = curC;
    }

    if (
      _.isNil(row_index) ||
      _.isNil(row_index_ed) ||
      _.isNil(col_index) ||
      _.isNil(col_index_ed)
    ) {
      console.error(
        "moveHighlightCell: row_index or row_index_ed or col_index or col_index_ed is nil"
      );
      return;
    }

    last.row = [row_index, row_index_ed];
    last.column = [col_index, col_index_ed];
    last.row_focus = row_index;
    last.column_focus = col_index;
    last.moveXY = { x: moveX, y: moveY };

    normalizeSelection(ctx, ctx.luckysheet_select_save);
    // TODO pivotTable.pivotclick(row_index, col_index);
    // TODO formula.fucntionboxshow(row_index, col_index);
  } else if (type === "rangeOfFormula") {
    const last = formulaCache.func_selectedrange;

    let curR;
    if (_.isNil(last.row_focus)) {
      [curR] = last.row;
    } else {
      curR = last.row_focus;
    }

    let curC;
    if (_.isNil(last.column_focus)) {
      [curC] = last.column;
    } else {
      curC = last.column_focus;
    }

    // focus单元格 是否是合并单元格
    const margeset = mergeBorder(ctx, flowdata, curR, curC);
    if (margeset) {
      const str_r = margeset.row[2];
      const end_r = margeset.row[3];

      const str_c = margeset.column[2];
      const end_c = margeset.column[3];

      if (index > 0) {
        if (postion === "down") {
          curR = end_r;
          curC = str_c;
        } else if (postion === "right") {
          curR = str_r;
          curC = end_c;
        }
      } else {
        curR = str_r;
        curC = str_c;
      }
    }

    if (_.isNil(curR) || _.isNil(curC)) {
      console.error("moveHighlightCell: curR or curC is nil");
      return;
    }

    let moveX = _.isNil(last.moveXY) ? curR : last.moveXY.x;
    let moveY = _.isNil(last.moveXY) ? curC : last.moveXY.y;

    if (postion === "down") {
      curR += index;
      moveX = curR;
    } else if (postion === "right") {
      curC += index;
      moveY = curC;
    }

    if (curR >= datarowlen) {
      curR = datarowlen - 1;
      moveX = curR;
    }

    if (curR < 0) {
      curR = 0;
      moveX = curR;
    }

    if (curC >= datacolumnlen) {
      curC = datacolumnlen - 1;
      moveY = curC;
    }

    if (curC < 0) {
      curC = 0;
      moveY = curC;
    }

    // 移动的下一个单元格是否是合并的单元格
    const margeset2 = mergeBorder(ctx, flowdata, curR, curC);
    if (margeset2) {
      [row_pre, row, row_index, row_index_ed] = margeset2.row;
      [col_pre, col, col_index, col_index_ed] = margeset2.column;
    } else {
      row = ctx.visibledatarow[moveX];
      row_pre = moveX - 1 === -1 ? 0 : ctx.visibledatarow[moveX - 1];
      row_index = moveX;
      row_index_ed = moveX;

      col = ctx.visibledatacolumn[moveY];
      col_pre = moveY - 1 === -1 ? 0 : ctx.visibledatacolumn[moveY - 1];
      col_index = moveY;
      col_index_ed = moveY;
    }

    if (
      _.isNil(col) ||
      _.isNil(col_pre) ||
      _.isNil(row) ||
      _.isNil(row_pre) ||
      _.isNil(row_index) ||
      _.isNil(row_index_ed) ||
      _.isNil(col_index) ||
      _.isNil(col_index_ed)
    ) {
      console.error(
        "moveHighlightCell: some values of func_selectedrange is nil"
      );
      return;
    }

    formulaCache.func_selectedrange = {
      left: col_pre,
      width: col - col_pre - 1,
      top: row_pre,
      height: row - row_pre - 1,
      left_move: col_pre,
      width_move: col - col_pre - 1,
      top_move: row_pre,
      height_move: row - row_pre - 1,
      row: [row_index, row_index_ed],
      column: [col_index, col_index_ed],
      row_focus: row_index,
      column_focus: col_index,
      moveXY: { x: moveX, y: moveY },
    };

    // $("#luckysheet-formula-functionrange-select")
    //   .css({
    //     left: col_pre,
    //     width: col - col_pre - 1,
    //     top: row_pre,
    //     height: row - row_pre - 1,
    //   })
    //   .show();

    // formula.rangeSetValue({
    //   row: [row_index, row_index_ed],
    //   column: [col_index, col_index_ed],
    // });
  }

  /*
  const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
  const scrollTop = $("#luckysheet-cell-main").scrollTop();
  const winH = $("#luckysheet-cell-main").height();
  const winW = $("#luckysheet-cell-main").width();

  let sleft = 0;
  let stop = 0;
  if (col - scrollLeft - winW + 20 > 0) {
    sleft = col - winW + 20;
    if (isScroll) {
      $("#luckysheet-scrollbar-x").scrollLeft(sleft);
    }
  } else if (col_pre - scrollLeft - 20 < 0) {
    sleft = col_pre - 20;
    if (isScroll) {
      $("#luckysheet-scrollbar-x").scrollLeft(sleft);
    }
  }

  if (row - scrollTop - winH + 20 > 0) {
    stop = row - winH + 20;
    if (isScroll) {
      $("#luckysheet-scrollbar-y").scrollTop(stop);
    }
  } else if (row_pre - scrollTop - 20 < 0) {
    stop = row_pre - 20;
    if (isScroll) {
      $("#luckysheet-scrollbar-y").scrollTop(stop);
    }
  }

  clearTimeout(ctx.countfuncTimeout);
  countfunc();
  */

  // 移动单元格通知后台
  // server.saveParam("mv", ctx.currentSheetIndex, ctx.luckysheet_select_save);
}
