import { Context } from "../context";
import { mergeBorder } from "./cell";

export function normalizeSelection(ctx: Context, selection: any[]) {
  for (let i = 0; i < selection.length; i += 1) {
    const r1 = selection[i].row[0];
    const r2 = selection[i].row[1];
    const c1 = selection[i].column[0];
    const c2 = selection[i].column[1];

    let rf;
    let cf;
    if (selection[i].row_focus == null) {
      rf = r1;
    } else {
      rf = selection[i].row_focus;
    }

    if (selection[i].column_focus == null) {
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

    const margeset = mergeBorder(ctx, ctx.flowdata, rf, cf);
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
