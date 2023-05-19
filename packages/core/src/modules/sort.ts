import numeral from "numeral";
import _ from "lodash";
import { execfunction, functionCopy, setCellValue } from ".";
import {
  Cell,
  Context,
  diff,
  getFlowdata,
  isdatetime,
  isRealNull,
  isRealNum,
} from "..";
import { jfrefreshgrid } from "./refresh";

export function orderbydata(
  isAsc: boolean,
  index: number,
  data: (Cell | null)[][]
) {
  if (isAsc == null) {
    isAsc = true;
  }
  const a = (x: any, y: any) => {
    let x1 = x[index];
    let y1 = y[index];
    if (x[index] != null) {
      x1 = x[index].v;
    }
    if (y[index] != null) {
      y1 = y[index].v;
    }
    if (isRealNull(x1)) {
      return isAsc ? 1 : -1;
    }

    if (isRealNull(y1)) {
      return isAsc ? -1 : 1;
    }
    if (isdatetime(x1) && isdatetime(y1)) {
      return diff(x1, y1);
    }
    if (isRealNum(x1) && isRealNum(y1)) {
      const y1Value = numeral(y1).value();
      const x1Value = numeral(x1).value();
      if (y1Value == null || x1Value == null) return null;
      return x1Value - y1Value;
    }
    if (!isRealNum(x1) && !isRealNum(y1)) {
      return x1.localeCompare(y1, "zh");
    }
    if (!isRealNum(x1)) {
      return 1;
    }
    if (!isRealNum(y1)) {
      return -1;
    }
    return 0;
  };
  const d = (x: any, y: any) => a(y, x);
  if (isAsc) {
    return data.sort(a);
  }
  return data.sort(d);
}

export function sortSelection(ctx: Context, isAsc: boolean) {
  // if (!checkProtectionAuthorityNormal(ctx.currentSheetIndex, "sort")) {
  //   return;
  // }
  if (ctx.allowEdit === false) return;
  if (ctx.luckysheet_select_save == null) return;
  if (ctx.luckysheet_select_save.length > 1) {
    // if (isEditMode()) {
    //   alert("不能对多重选择区域执行此操作，请选择单个区域，然后再试");
    // } else {
    //   tooltip.info(
    //     "不能对多重选择区域执行此操作，请选择单个区域，然后再试",
    //     ""
    //   );
    // }

    return;
  }

  if (isAsc == null) {
    isAsc = true;
  }
  // const d = editor.deepCopyFlowData(Store.flowdata);
  const flowdata = getFlowdata(ctx);
  const d = flowdata;
  if (d == null) return;

  const r1 = ctx.luckysheet_select_save[0].row[0];
  const r2 = ctx.luckysheet_select_save[0].row[1];
  const c1 = ctx.luckysheet_select_save[0].column[0];
  const c2 = ctx.luckysheet_select_save[0].column[1];

  let str: number | null = null;
  let edr;

  for (let r = r1; r <= r2; r += 1) {
    if (d[r] != null && d[r][c1] != null) {
      const cell = d[r][c1];
      if (cell == null) return; //
      if (cell.mc != null || isRealNull(cell.v)) {
        continue;
      }
      if (str == null && /[\u4e00-\u9fa5]+/g.test(`${cell.v}`)) {
        str = r + 1;
        edr = r + 1;
        continue;
      }

      if (str == null) {
        str = r;
      }

      edr = r;
    }
  }

  if (str == null || str > r2) {
    return;
  }

  let hasMc = false; // 排序选区是否有合并单元格
  let data: any[][] = [];
  if (edr == null) return;
  for (let r = str; r <= edr; r += 1) {
    const data_row = [];
    for (let c = c1; c <= c2; c += 1) {
      if (d[r][c] != null && d[r][c]?.mc != null) {
        hasMc = true;
        break;
      }

      data_row.push(d[r][c]);
    }

    data.push(data_row);
  }

  if (hasMc) {
    // if (isEditMode()) {
    //   alert("选区有合并单元格，无法执行此操作！");
    // } else {
    //   tooltip.info("选区有合并单元格，无法执行此操作！", "");
    // }

    return;
  }

  const oldData = _.cloneDeep(data);
  data = orderbydata(isAsc, 0, data);
  for (let r = str; r <= edr; r += 1) {
    for (let c = c1; c <= c2; c += 1) {
      d[r][c] = data[r - str][c - c1];
      setCellValue(ctx, r, c, d, data[r - str][c - c1]);
    }
  }

  for (let r = str; r <= edr; r += 1) {
    for (let c = c1; c <= c2; c += 1) {
      if (oldData[r - str][c - c1]?.f) {
        const index = _.findIndex(oldData, (row) => {
          return _.some(
            row,
            (cell) => cell!.f === data[r - (str || 0)][c - c1]?.f
          );
        });
        const offsetRow = r - str - index;
        let func = data[r - str][c - c1]!.f;
        if (offsetRow > 0) {
          func = `=${functionCopy(ctx, func!, "down", offsetRow)}`;
        }

        if (offsetRow < 0) {
          func = `=${functionCopy(ctx, func!, "up", Math.abs(offsetRow))}`;
        }
        const funcV = execfunction(ctx, func!, r, c, undefined, true);
        [, data[r - str][c - c1]!.v, data[r - str][c - c1]!.f] = funcV;
      }
      setCellValue(ctx, r, c, d, data[r - str][c - c1]);
    }
  }
  // let allParam = {};
  // if (ctx.config.rowlen != null) {
  //   // let cfg = $.extend(true, {}, Store.config);
  //   let cfg = _.cloneDeep(ctx.config);
  //   cfg = rowlenByRange(d, str, edr, cfg);

  //   allParam = {
  //     cfg,
  //     RowlChange: true,
  //   };
  // }

  jfrefreshgrid(ctx, d, [{ row: [str, edr], column: [c1, c2] }]);
}
