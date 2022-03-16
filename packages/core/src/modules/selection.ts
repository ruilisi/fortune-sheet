import _ from "lodash";
import { Context, getFlowdata } from "../context";
import { mergeBorder } from "./cell";

export function normalizeSelection(ctx: Context, selection: any[]) {
  const flowdata = getFlowdata(ctx);
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

export function selectTitlesMap(rangeMap: any, range1: number, range2: number) {
  const map = rangeMap || {};
  for (let i = range1; i <= range2; i += 1) {
    if (i in map) {
      continue;
    }
    map[i] = 0;
  }
  return map;
}

export function selectTitlesRange(map: any) {
  const mapArr = [];

  for (const i in map) {
    mapArr.push(i);
  }

  mapArr.sort((a, b) => {
    return a - b;
  });

  const rangeArr = [];
  let item = [];

  if (mapArr.length > 1) {
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
            rangeArr.push(mapArr[0]);
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
    rangeArr.push([mapArr[0]]);
  }

  return rangeArr;
}
